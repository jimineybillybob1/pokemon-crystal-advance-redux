param(
  [Parameter(Mandatory = $true)]
  [string]$RomPath,

  [string]$HexManiacDirectory = "$env:LOCALAPPDATA\Temp\hma-0.6.1\app",

  [string]$OutputPath = (Join-Path $PSScriptRoot "..\sources\reports\rom-scripted-item-audit-2026-09-29.json")
)

$ErrorActionPreference = "Stop"

$ExpectedSha256 = "716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B"
$HexManiacAssembly = Join-Path $HexManiacDirectory "HexManiac.Core.dll"

if (-not (Test-Path -LiteralPath $RomPath)) {
  throw "ROM not found: $RomPath"
}
if (-not (Test-Path -LiteralPath $HexManiacAssembly)) {
  throw "HexManiac.Core.dll not found: $HexManiacAssembly"
}

$actualSha256 = (Get-FileHash -LiteralPath $RomPath -Algorithm SHA256).Hash
if ($actualSha256 -ne $ExpectedSha256) {
  throw "Unsupported ROM build. Expected SHA-256 $ExpectedSha256 but found $actualSha256."
}

$previousCurrentDirectory = [Environment]::CurrentDirectory
Push-Location $HexManiacDirectory
[Environment]::CurrentDirectory = $HexManiacDirectory
try {
  Add-Type -Path $HexManiacAssembly

  function Keep-Object($Value) {
    Write-Output -NoEnumerate $Value
  }

  $romBytes = [IO.File]::ReadAllBytes($RomPath)
  $singletons = [HavenSoft.HexManiac.Core.Models.Singletons]::new(
    [HavenSoft.HexManiac.Core.Models.InstantDispatch]::Instance,
    100000
  )
  $metadata = [HavenSoft.HexManiac.Core.Models.StoredMetadata]::new([string[]]@())
  $model = Keep-Object ([HavenSoft.HexManiac.Core.Models.HardcodeTablesModel]::new(
    $singletons,
    $romBytes,
    $metadata,
    $false
  ))
  $null = $model.InitializationWorkload.Wait()
  $noChange = [HavenSoft.HexManiac.Core.Models.NoDataChangeDeltaModel]::new()

  function Get-ModelTable([string]$Anchor) {
    $address = $model.GetAddressFromAnchor($noChange, -1, $Anchor)
    if ($address -lt 0) {
      throw "Anchor not found: $Anchor"
    }
    $run = $model.GetNextRun($address)
    return Keep-Object ([HavenSoft.HexManiac.Core.Models.ModelTable]::new(
      [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
      [HavenSoft.HexManiac.Core.Models.Runs.ITableRun]$run,
      $null
    ))
  }

  function Read-Pointer([int]$Address) {
    if ($Address -lt 0 -or $Address + 4 -gt $romBytes.Length) {
      return -1
    }
    $value = [BitConverter]::ToUInt32($romBytes, $Address)
    if ($value -ge 0x08000000 -and $value -lt 0x0A000000) {
      return [int]($value - 0x08000000)
    }
    return -1
  }

  function Read-U16([int]$Address) {
    if ($Address -lt 0 -or $Address + 2 -gt $romBytes.Length) {
      return -1
    }
    return [BitConverter]::ToUInt16($romBytes, $Address)
  }

  function Read-GameText([int]$Address, [int]$Length) {
    if ($Address -lt 0 -or $Address + $Length -gt $romBytes.Length) {
      return ""
    }
    $text = $model.TextConverter.Convert($romBytes, $Address, $Length, $false)
    return $text.Replace(([char]0xFF).ToString(), "").Trim('"').Trim()
  }

  function Get-StandardItemAddress([int]$ScriptAddress) {
    if ($ScriptAddress -lt 0 -or $ScriptAddress + 12 -gt $romBytes.Length) {
      return -1
    }
    $expected = @{
      0 = 0x1A; 1 = 0x00; 2 = 0x80; 5 = 0x1A; 6 = 0x01; 7 = 0x80
      8 = 0x01; 9 = 0x00; 10 = 0x09; 11 = 0x01
    }
    foreach ($offset in $expected.Keys) {
      if ($romBytes[$ScriptAddress + $offset] -ne $expected[$offset]) {
        return -1
      }
    }
    return $ScriptAddress + 3
  }

  $mapNames = Keep-Object (Get-ModelTable "data.maps.names")
  $mapBanks = Keep-Object (Get-ModelTable "data.maps.banks")
  $wildTable = Keep-Object (Get-ModelTable "data.pokemon.wild")
  $itemTable = Keep-Object (Get-ModelTable "data.items.stats")
  $itemTableStart = $itemTable[0].Start
  $itemElementLength = $itemTable[0].Length
  $pokemonNames = Keep-Object (Get-ModelTable "data.pokemon.names")
  $pokemonNameStart = $pokemonNames[0].Start
  $pokemonNameLength = $pokemonNames[0].Length
  $allMaps = [HavenSoft.HexManiac.Core.Models.Map.AllMapsModel]::Create(
    [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
    $null
  )
  $scriptParser = [HavenSoft.HexManiac.Core.Models.Code.ScriptParser]::new(
    0x45525042,
    $singletons.ScriptLines,
    0x02
  )

  function Resolve-Item([int]$Id) {
    if ($Id -le 0 -or $Id -ge $itemTable.Count) {
      return $null
    }
    return Read-GameText ($itemTableStart + ($Id * $itemElementLength)) 14
  }

  function Resolve-Pokemon([int]$Id) {
    if ($Id -le 0 -or $Id -ge $pokemonNames.Count) {
      return $null
    }
    return Read-GameText ($pokemonNameStart + ($Id * $pokemonNameLength)) $pokemonNameLength
  }

  function Get-RegionName([int]$HeaderAddress) {
    if ($HeaderAddress -lt 0 -or $HeaderAddress + 21 -gt $romBytes.Length) {
      return $null
    }
    $nameIndex = [int]$romBytes[$HeaderAddress + 20]
    if ($nameIndex -lt 0 -or $nameIndex -ge $mapNames.Count) {
      return $null
    }
    return $mapNames[$nameIndex].GetStringValue("name")
  }

  function New-SourceRecord($MapRecord, [string]$SourceType, $Event) {
    return [pscustomobject][ordered]@{
      mapKey = $MapRecord.key
      regionName = $MapRecord.regionName
      layoutId = $MapRecord.layoutId
      sourceType = $SourceType
      x = if ($null -ne $Event) { $Event.X } else { $null }
      y = if ($null -ne $Event) { $Event.Y } else { $null }
      elevation = if ($null -ne $Event) { $Event.Elevation } else { $null }
      scriptAddress = if ($null -ne $Event -and $Event.ScriptAddress -ge 0) { "0x{0:X}" -f $Event.ScriptAddress } else { $null }
    }
  }

  $maps = [Collections.Generic.List[object]]::new()
  $mapLookup = @{}
  for ($bankIndex = 0; $bankIndex -lt $mapBanks.Count; $bankIndex++) {
    $bankMaps = Keep-Object ($mapBanks[$bankIndex].GetSubTable("maps"))
    if ($null -eq $bankMaps) {
      continue
    }
    for ($mapIndex = 0; $mapIndex -lt $bankMaps.Count; $mapIndex++) {
      $headerAddress = $bankMaps[$mapIndex].GetAddress("map")
      if ($headerAddress -lt 0 -or $headerAddress + 28 -gt $romBytes.Length) {
        continue
      }
      $mapModel = $allMaps[$bankIndex][$mapIndex]
      if ($null -eq $mapModel) {
        continue
      }
      $mapRecord = [pscustomobject][ordered]@{
        key = "$bankIndex,$mapIndex"
        bank = $bankIndex
        map = $mapIndex
        regionName = Get-RegionName $headerAddress
        layoutId = Read-U16 ($headerAddress + 18)
        width = $mapModel.Layout.Width
        height = $mapModel.Layout.Height
        model = $mapModel
      }
      $maps.Add($mapRecord)
      $mapLookup[$mapRecord.key] = $mapRecord
    }
  }

  # The hack reuses map headers and labels. Preserve complete wild-table
  # fingerprints so Route 31 can be identified from the workbook's ordered
  # encounter slots without trusting a stale region-name field.
  $wildFingerprints = [Collections.Generic.List[object]]::new()
  for ($recordIndex = 0; $recordIndex -lt $wildTable.Count; $recordIndex++) {
    $record = $wildTable[$recordIndex]
    $key = "$($record.GetValue('bank')),$($record.GetValue('map'))"
    if (-not $mapLookup.ContainsKey($key)) {
      continue
    }
    $parts = [Collections.Generic.List[string]]::new()
    $methods = [ordered]@{}
    foreach ($definition in @(
      [pscustomobject]@{ field = "grass"; count = 12 },
      [pscustomobject]@{ field = "tree"; count = 5 },
      [pscustomobject]@{ field = "surf"; count = 5 },
      [pscustomobject]@{ field = "fish"; count = 10 }
    )) {
      try {
        $headerAddress = $record.GetAddress($definition.field)
      } catch {
        $headerAddress = -1
      }
      $species = [Collections.Generic.List[int]]::new()
      if ($headerAddress -ge 0) {
        $listAddress = Read-Pointer ($headerAddress + 4)
        if ($listAddress -ge 0) {
          for ($slotIndex = 0; $slotIndex -lt $definition.count; $slotIndex++) {
            $species.Add((Read-U16 ($listAddress + ($slotIndex * 4) + 2)))
          }
        }
      }
      $methods[$definition.field] = @($species)
      $parts.Add("$($definition.field):$($species -join ',')")
    }
    $wildFingerprints.Add([pscustomobject][ordered]@{
      recordIndex = $recordIndex
      mapKey = $key
      regionName = $mapLookup[$key].regionName
      fingerprint = $parts -join ";"
      methods = [pscustomobject]$methods
    })
  }

  $visibleItems = [Collections.Generic.List[object]]::new()
  $hiddenItems = [Collections.Generic.List[object]]::new()
  $scriptOccurrences = [Collections.Generic.List[object]]::new()

  foreach ($mapRecord in $maps) {
    $mapModel = $mapRecord.model

    foreach ($signpost in $mapModel.Events.Signposts) {
      if ($signpost.IsHiddenItem) {
        $itemId = $signpost.ItemValue
        $hiddenItems.Add([pscustomobject][ordered]@{
          mapKey = $mapRecord.key
          regionName = $mapRecord.regionName
          layoutId = $mapRecord.layoutId
          x = $signpost.X
          y = $signpost.Y
          elevation = $signpost.Elevation
          coordinateValid = $signpost.X -ge 0 -and $signpost.Y -ge 0 -and $signpost.X -lt $mapRecord.width -and $signpost.Y -lt $mapRecord.height
          itemId = $itemId
          item = Resolve-Item $itemId
          quantity = $signpost.HiddenItemCount
          hiddenItemFlag = $signpost.HiddenItemFlag
        })
      }
    }

    foreach ($objectEvent in $mapModel.Events.Objects) {
      $itemAddress = Get-StandardItemAddress $objectEvent.ScriptAddress
      if ($itemAddress -ge 0) {
        $itemId = Read-U16 $itemAddress
        $visibleItems.Add([pscustomobject][ordered]@{
          mapKey = $mapRecord.key
          regionName = $mapRecord.regionName
          layoutId = $mapRecord.layoutId
          x = $objectEvent.X
          y = $objectEvent.Y
          elevation = $objectEvent.Elevation
          coordinateValid = $objectEvent.X -ge 0 -and $objectEvent.Y -ge 0 -and $objectEvent.X -lt $mapRecord.width -and $objectEvent.Y -lt $mapRecord.height
          itemId = $itemId
          item = Resolve-Item $itemId
          objectFlag = $objectEvent.Flag
          scriptAddress = "0x{0:X}" -f $objectEvent.ScriptAddress
        })
      }
    }

    $eventSources = [Collections.Generic.List[object]]::new()
    foreach ($objectEvent in $mapModel.Events.Objects) {
      if ($objectEvent.ScriptAddress -ge 0) {
        $eventSources.Add((New-SourceRecord $mapRecord "Object" $objectEvent))
      }
    }
    foreach ($scriptEvent in $mapModel.Events.Scripts) {
      if ($scriptEvent.ScriptAddress -ge 0) {
        $eventSources.Add((New-SourceRecord $mapRecord "Coordinate script" $scriptEvent))
      }
    }
    foreach ($signpost in $mapModel.Events.Signposts) {
      if ($signpost.HasScript -and $signpost.ScriptAddress -ge 0) {
        $eventSources.Add((New-SourceRecord $mapRecord "Signpost script" $signpost))
      }
    }

    foreach ($source in $eventSources) {
      $scriptAddressValue = [Convert]::ToInt32($source.scriptAddress.Substring(2), 16)
      try {
        $spots = [HavenSoft.HexManiac.Core.ViewModels.Map.Flags]::GetAllScriptSpots(
          [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
          $scriptParser,
          [int[]]@($scriptAddressValue),
          [byte[]]@(0x44, 0x49, 0x79, 0x86)
        )
      } catch {
        continue
      }

      foreach ($spot in @($spots | Sort-Object Address -Unique)) {
        $address = [int]$spot.Address
        if ($address -lt 0 -or $address -ge $romBytes.Length) {
          continue
        }
        $opcode = [int]$romBytes[$address]
        $record = [ordered]@{
          mapKey = $source.mapKey
          regionName = $source.regionName
          layoutId = $source.layoutId
          sourceType = $source.sourceType
          x = $source.x
          y = $source.y
          elevation = $source.elevation
          rootScriptAddress = $source.scriptAddress
          commandAddress = "0x{0:X}" -f $address
          opcode = "0x{0:X2}" -f $opcode
          kind = $null
          itemId = $null
          item = $null
          quantity = $null
          speciesId = $null
          pokemon = $null
          listAddress = $null
          products = @()
          dynamic = $false
        }

        if ($opcode -eq 0x44 -or $opcode -eq 0x49) {
          $itemId = Read-U16 ($address + 1)
          $quantity = Read-U16 ($address + 3)
          $record.kind = if ($opcode -eq 0x44) { "Add item" } else { "Add PC item" }
          $record.itemId = $itemId
          $record.item = Resolve-Item $itemId
          $record.quantity = $quantity
          $record.dynamic = $itemId -ge 0x4000 -or $quantity -ge 0x4000
        } elseif ($opcode -eq 0x79) {
          $speciesId = Read-U16 ($address + 1)
          $itemId = Read-U16 ($address + 4)
          $record.kind = "Gift Pokemon held item"
          $record.itemId = $itemId
          $record.item = Resolve-Item $itemId
          $record.quantity = if ($itemId -gt 0) { 1 } else { 0 }
          $record.speciesId = $speciesId
          $record.pokemon = Resolve-Pokemon $speciesId
          $record.dynamic = $speciesId -ge 0x4000 -or $itemId -ge 0x4000
        } elseif ($opcode -eq 0x86) {
          $listAddress = Read-Pointer ($address + 1)
          $products = [Collections.Generic.List[object]]::new()
          if ($listAddress -ge 0) {
            for ($productIndex = 0; $productIndex -lt 512; $productIndex++) {
              $itemId = Read-U16 ($listAddress + ($productIndex * 2))
              if ($itemId -eq 0) {
                break
              }
              if ($itemId -lt 0 -or $itemId -ge 0x4000) {
                break
              }
              $products.Add([pscustomobject][ordered]@{
                slot = $productIndex
                itemId = $itemId
                item = Resolve-Item $itemId
              })
            }
          }
          $record.kind = "Poke Mart"
          $record.listAddress = if ($listAddress -ge 0) { "0x{0:X}" -f $listAddress } else { $null }
          $record.products = @($products)
          $record.dynamic = $listAddress -lt 0
        } else {
          continue
        }
        $scriptOccurrences.Add([pscustomobject]$record)
      }
    }
  }

  $scriptOccurrences = @(
    $scriptOccurrences |
      Sort-Object mapKey, sourceType, x, y, commandAddress -Unique
  )

  $scriptCommands = [Collections.Generic.List[object]]::new()
  foreach ($group in @($scriptOccurrences | Group-Object commandAddress, opcode)) {
    $first = $group.Group[0]
    $contexts = @(
      $group.Group |
        Sort-Object mapKey, sourceType, x, y, rootScriptAddress -Unique |
        ForEach-Object {
          [pscustomobject][ordered]@{
            mapKey = $_.mapKey
            regionName = $_.regionName
            layoutId = $_.layoutId
            sourceType = $_.sourceType
            x = $_.x
            y = $_.y
            elevation = $_.elevation
            rootScriptAddress = $_.rootScriptAddress
          }
        }
    )
    $mapCount = @($contexts | Select-Object -ExpandProperty mapKey -Unique).Count
    $association = if ($mapCount -le 3 -and $contexts.Count -le 10) {
      "map-local"
    } else {
      "shared/global path; location unresolved"
    }
    $scriptCommands.Add([pscustomobject][ordered]@{
      commandAddress = $first.commandAddress
      opcode = $first.opcode
      kind = $first.kind
      itemId = $first.itemId
      item = $first.item
      quantity = $first.quantity
      speciesId = $first.speciesId
      pokemon = $first.pokemon
      listAddress = $first.listAddress
      products = $first.products
      dynamic = $first.dynamic
      association = $association
      contextCount = $contexts.Count
      mapCount = $mapCount
      contexts = @($contexts | Select-Object -First 20)
      contextsTruncated = $contexts.Count -gt 20
    })
  }

  $route31ExpectedMethods = [pscustomobject][ordered]@{
    grass = @(10, 13, 165, 167, 32, 29, 69, 60, 265, 309, 280, 401)
    tree = @(163, 204, 167, 102, 406)
    surf = @(60, 118, 61, 61, 119)
    fish = @(60, 129, 60, 118, 129, 129, 60, 118, 61, 119)
  }
  $route31TemplateFingerprint = @(
    "grass:$($route31ExpectedMethods.grass -join ',')"
    "tree:$($route31ExpectedMethods.tree -join ',')"
    "surf:$($route31ExpectedMethods.surf -join ',')"
    "fish:$($route31ExpectedMethods.fish -join ',')"
  ) -join ";"
  $route31FingerprintMatches = @(
    $wildFingerprints |
      Where-Object { $_.fingerprint -eq $route31TemplateFingerprint } |
      Sort-Object mapKey, recordIndex
  )
  $route31SimilarityCandidates = [Collections.Generic.List[object]]::new()
  foreach ($candidate in $wildFingerprints) {
    $matched = 0
    $compared = 0
    foreach ($field in @("grass", "tree", "surf", "fish")) {
      $left = @($route31ExpectedMethods.$field)
      $right = @($candidate.methods.$field)
      $limit = [Math]::Min($left.Count, $right.Count)
      for ($index = 0; $index -lt $limit; $index++) {
        $compared++
        if ($left[$index] -eq $right[$index]) {
          $matched++
        }
      }
    }
    if ($matched -gt 0) {
      $route31SimilarityCandidates.Add([pscustomobject][ordered]@{
        recordIndex = $candidate.recordIndex
        mapKey = $candidate.mapKey
        regionName = $candidate.regionName
        matchedSlots = $matched
        comparedSlots = $compared
        matchPercent = if ($compared -gt 0) { [Math]::Round(($matched * 100.0) / $compared, 1) } else { 0 }
        methods = $candidate.methods
      })
    }
  }
  $route31SimilarityCandidates = @(
    $route31SimilarityCandidates |
      Sort-Object @{ Expression = { $_.matchedSlots }; Descending = $true }, mapKey, recordIndex |
      Select-Object -First 20
  )
  $route31MapKeys = @(
    if ($route31FingerprintMatches.Count -gt 0) {
      $route31FingerprintMatches | Select-Object -ExpandProperty mapKey -Unique
    } else {
      # The post-workbook ROM changes five rare/custom slots. Require at least
      # 80% positional agreement, then corroborate the result in the review
      # report with trainer and field-item evidence before importing anything.
      $route31SimilarityCandidates |
        Where-Object matchPercent -ge 80 |
        Select-Object -ExpandProperty mapKey -Unique
    }
  )
  $route31Visible = @($visibleItems | Where-Object { $_.mapKey -in $route31MapKeys })
  $route31Hidden = @($hiddenItems | Where-Object { $_.mapKey -in $route31MapKeys })
  $route31Scripts = @(
    $scriptCommands |
      Where-Object { @($_.contexts | Where-Object { $_.mapKey -in $route31MapKeys }).Count -gt 0 }
  )

  $result = [ordered]@{
    meta = [ordered]@{
      title = "Pokemon Crystal Advance Redux scripted item, shop and reward audit"
      gameVersion = "2026-07-19"
      extractedAt = (Get-Date).ToUniversalTime().ToString("o")
      romSha256 = $actualSha256
      romSize = $romBytes.Length
      romHeaderTitle = [Text.Encoding]::ASCII.GetString($romBytes, 0xA0, 12).Trim([char]0)
      gameCode = [Text.Encoding]::ASCII.GetString($romBytes, 0xAC, 4)
      extractionTool = "Hex Maniac Advance Core 0.6.1 plus project extraction script"
      notes = @(
        "The ROM itself is not copied into the project.",
        "All active map object, coordinate and signpost scripts are followed recursively for additem, addpcitem, givePokemon and pokemart commands.",
        "Map-level startup script tables are not treated as acquisition evidence unless they are reachable from one of those map events.",
        "The hack reuses map headers and region labels, so Route 31 is identified by the ordered encounter slots in the 2026-07-01 workbook rather than by a region-name string.",
        "A command may appear under more than one map or event when a shared subscript is reachable from multiple roots; each occurrence retains that context.",
        "Commands reached from more than three maps or ten roots are marked shared/global and are not safe location evidence.",
        "Dynamic variable-based item grants are retained as unresolved and are not imported as literal availability.",
        "Visible item balls and hidden signpost items are audited separately from scripted grants."
      )
    }
    summary = [ordered]@{
      activeMapCount = $maps.Count
      visibleItemCount = $visibleItems.Count
      hiddenItemCount = $hiddenItems.Count
      scriptedOccurrenceCount = $scriptOccurrences.Count
      uniqueScriptCommandCount = $scriptCommands.Count
      uniqueDirectItemGrantCount = @($scriptCommands | Where-Object kind -eq "Add item").Count
      uniquePcItemGrantCount = @($scriptCommands | Where-Object kind -eq "Add PC item").Count
      uniqueGiftPokemonHeldItemCount = @($scriptCommands | Where-Object kind -eq "Gift Pokemon held item").Count
      uniquePokeMartCount = @($scriptCommands | Where-Object kind -eq "Poke Mart").Count
      mapLocalCommandCount = @($scriptCommands | Where-Object association -eq "map-local").Count
      sharedOrGlobalCommandCount = @($scriptCommands | Where-Object association -ne "map-local").Count
      dynamicCommandCount = @($scriptCommands | Where-Object dynamic).Count
      route31FingerprintMatchCount = $route31FingerprintMatches.Count
      route31CandidateMapCount = $route31MapKeys.Count
      route31VisibleItemCount = $route31Visible.Count
      route31HiddenItemCount = $route31Hidden.Count
      route31ScriptOccurrenceCount = $route31Scripts.Count
    }
    route31 = [ordered]@{
      expectedMethods = $route31ExpectedMethods
      fingerprintMatches = $route31FingerprintMatches
      similarityCandidates = $route31SimilarityCandidates
      candidateMapKeys = $route31MapKeys
      visibleItems = @($route31Visible | Sort-Object mapKey, x, y)
      hiddenItems = @($route31Hidden | Sort-Object mapKey, x, y)
      scriptedOccurrences = @($route31Scripts | Sort-Object mapKey, sourceType, x, y, commandAddress)
    }
    visibleItems = @($visibleItems | Sort-Object regionName, mapKey, x, y)
    hiddenItems = @($hiddenItems | Sort-Object regionName, mapKey, x, y)
    scriptedCommands = @($scriptCommands | Sort-Object kind, commandAddress)
  }

  $resolvedOutputPath = [IO.Path]::GetFullPath($OutputPath)
  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if (-not (Test-Path -LiteralPath $outputDirectory)) {
    $null = New-Item -ItemType Directory -Path $outputDirectory
  }
  $result | ConvertTo-Json -Depth 100 | Set-Content -LiteralPath $resolvedOutputPath -Encoding UTF8
  Write-Output "Wrote $resolvedOutputPath"
  $result.summary | Format-List | Out-String | Write-Output
} finally {
  [Environment]::CurrentDirectory = $previousCurrentDirectory
  Pop-Location
}
