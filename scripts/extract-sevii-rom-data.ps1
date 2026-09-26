param(
  [Parameter(Mandatory = $true)]
  [string]$RomPath,

  [string]$HexManiacDirectory = "$env:LOCALAPPDATA\Temp\hma-0.6.1\app",

  [string]$OutputPath = (Join-Path $PSScriptRoot "..\sources\reports\sevii-rom-extraction.json")
)

$ErrorActionPreference = "Stop"

$ExpectedSha256 = "716F2CBFB731E6DC1E014B6B6744B823389262DCC0086A120C1E0FB3D80DD34B"
$HexManiacAssembly = Join-Path $HexManiacDirectory "HexManiac.Core.dll"
$GuideDataPath = Join-Path $PSScriptRoot "..\data\guide-data.json"

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

  function Try-Get-ModelTable([string]$Anchor) {
    $address = $model.GetAddressFromAnchor($noChange, -1, $Anchor)
    if ($address -lt 0) {
      return $null
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
      0 = 0x1A
      1 = 0x00
      2 = 0x80
      5 = 0x1A
      6 = 0x01
      7 = 0x80
      8 = 0x01
      9 = 0x00
      10 = 0x09
      11 = 0x01
    }
    foreach ($offset in $expected.Keys) {
      if ($romBytes[$ScriptAddress + $offset] -ne $expected[$offset]) {
        return -1
      }
    }
    return $ScriptAddress + 3
  }

  $guideData = Get-Content -LiteralPath $GuideDataPath -Raw | ConvertFrom-Json -Depth 100

  $moveById = @{}
  foreach ($move in $guideData.moves) {
    $moveById[[int]$move.id] = $move.name
  }

  function Resolve-Pokemon([int]$Id) {
    if ($Id -eq 0) {
      return $null
    }
    if ($romPokemonAliases.ContainsKey($Id)) {
      return $romPokemonAliases[$Id]
    }
    $address = $pokemonNameTableStart + ($Id * $pokemonNameElementLength)
    $name = Read-GameText $address $pokemonNameElementLength
    if (-not [string]::IsNullOrWhiteSpace($name) -and $name -notmatch '^\?+$') {
      return $name
    }
    return "Unknown species $Id"
  }

  function Resolve-Move([int]$Id) {
    if ($Id -eq 0) {
      return $null
    }
    if ($moveById.ContainsKey($Id)) {
      return $moveById[$Id]
    }
    return "Unknown move $Id"
  }

  function Resolve-Item([int]$Id) {
    if ($Id -eq 0) {
      return $null
    }
    $address = $itemTableStart + ($Id * $itemElementLength)
    $name = Read-GameText $address 14
    if (-not [string]::IsNullOrWhiteSpace($name)) {
      return $name
    }
    return "Unknown item $Id"
  }

  $mapNames = Keep-Object (Get-ModelTable "data.maps.names")
  $mapBanks = Keep-Object (Get-ModelTable "data.maps.banks")
  $wildTable = Keep-Object (Get-ModelTable "data.pokemon.wild")
  $trainerClasses = Keep-Object (Get-ModelTable "data.trainers.classes.names")
  $pokemonNameTable = Keep-Object (Get-ModelTable "data.pokemon.names")
  $pokemonNameTableStart = $pokemonNameTable[0].Start
  $pokemonNameElementLength = $pokemonNameTable[0].Length
  $romPokemonAliases = @{
    562 = "Raichu-Alola"
    563 = "Marowak-Alola"
    564 = "Exeggutor-Alola"
    565 = "Weezing-Galar"
    566 = "Typhlosion-Hisui"
    567 = "Sandshrew-Alola"
    568 = "Sandslash-Alola"
    569 = "Vulpix-Alola"
    570 = "Ninetales-Alola"
    571 = "Rattata-Alola"
    572 = "Raticate-Alola"
    573 = "Meowth-Alola"
    574 = "Persian-Alola"
    575 = "Diglett-Alola"
    576 = "Dugtrio-Alola"
    577 = "Geodude-Alola"
    578 = "Graveler-Alola"
    579 = "Golem-Alola"
    580 = "Grimer-Alola"
    581 = "Muk-Alola"
    582 = "Ponyta-Galar"
    583 = "Rapidash-Galar"
    584 = "Farfetch'd-Galar"
    586 = "Growlithe-Hisui"
    587 = "Arcanine-Hisui"
    588 = "Mr. Mime-Galar"
    590 = "Zigzagoon-Galar"
    591 = "Linoone-Galar"
    593 = "Corsola-Galar"
    595 = "Meowth-Galar"
    597 = "Qwilfish-Hisui"
    599 = "Slowpoke-Galar"
    600 = "Slowbro-Galar"
    601 = "Slowking-Galar"
    602 = "Voltorb-Hisui"
    603 = "Electrode-Hisui"
    604 = "Wooper-Paldea"
    606 = "Sneasel-Hisui"
    608 = "Mewtwo-Armored"
    609 = "Articuno-Galar"
    610 = "Zapdos-Galar"
    611 = "Moltres-Galar"
    612 = "Giratina-Origin"
    613 = "Palkia-Origin"
    614 = "Dialga-Origin"
    615 = "Rotom-Heat"
    616 = "Rotom-Wash"
    617 = "Rotom-Frost"
    618 = "Rotom-Fan"
    619 = "Rotom-Mow"
    620 = "Tauros-Paldea-Combat"
    621 = "Tauros-Paldea-Blaze"
    622 = "Tauros-Paldea-Aqua"
    623 = "Pikachu-Surf"
    624 = "Pikachu-Fly"
    625 = "Pikachu-Partner"
    626 = "Eevee-Partner"
    627 = "Deoxys-Attack"
    628 = "Deoxys-Defense"
    629 = "Deoxys-Speed"
    630 = "Venusaur-Clone"
    631 = "Charizard-Clone"
    632 = "Blastoise-Clone"
    633 = "Onix-C"
    634 = "Steelix-C"
    635 = "Ursaluna-Blood-Moon"
    636 = "XD001"
  }
  $itemTable = Keep-Object (Get-ModelTable "data.items.stats")
  $itemTableStart = $itemTable[0].Start
  $itemElementLength = $itemTable[0].Length
  $allMaps = [HavenSoft.HexManiac.Core.Models.Map.AllMapsModel]::Create(
    [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
    $null
  )
  $scriptParser = [HavenSoft.HexManiac.Core.Models.Code.ScriptParser]::new(
    0x45525042,
    $singletons.ScriptLines,
    0x02
  )
  $trainerTableStart = $model.GetAddressFromAnchor($noChange, -1, "data.trainers.stats")
  # Crystal Advance Redux does not expose HexManiac's stock FireRed rematch
  # anchor. Keep this optional so the reproducible extraction still records
  # trainer commands without pretending that their staged rematches are known.
  $trainerRematchTable = Keep-Object (Try-Get-ModelTable "data.trainers.rematches")

  $seviiRegionNames = @(
    "Sevii Waterway",
    "One Island",
    "Kindle Road",
    "Ember Cavern",
    "Mt. Ember",
    "Crystal Cavern",
    "Two Island",
    "Cape Brink",
    "Three Island",
    "Berry Forest",
    "Four Island",
    "Icefall Cave",
    "Five Island",
    "Memorial Pass",
    "Memorial Pillar",
    "Resort Gorgeous",
    "Six Island",
    "Ruins Valley",
    "Ruins Cavern",
    "Sevii Ruins",
    "Underwater Sevii"
  )

  function Get-MapRegionName([int]$Bank, [int]$Map) {
    if ($Bank -lt 0 -or $Bank -ge $mapBanks.Count) {
      return $null
    }
    $bankMaps = Keep-Object ($mapBanks[$Bank].GetSubTable("maps"))
    if ($null -eq $bankMaps -or $Map -lt 0 -or $Map -ge $bankMaps.Count) {
      return $null
    }
    $headerAddress = $bankMaps[$Map].GetAddress("map")
    if ($headerAddress -lt 0 -or $headerAddress + 20 -ge $romBytes.Length) {
      return $null
    }
    $nameIndex = [int]$romBytes[$headerAddress + 20]
    if ($nameIndex -lt 0 -or $nameIndex -ge $mapNames.Count) {
      return $null
    }
    return $mapNames[$nameIndex].GetStringValue("name")
  }

  function Get-MapHeaderValue($MapModel, [string]$Field) {
    if ($null -eq $MapModel -or -not $MapModel.Element.HasField($Field)) {
      return $null
    }
    return $MapModel.Element.GetValue($Field)
  }

  $allMapIndex = @{}
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
      $nameIndex = [int]$romBytes[$headerAddress + 20]
      $regionName = if ($nameIndex -lt $mapNames.Count) {
        $mapNames[$nameIndex].GetStringValue("name")
      } else {
        $null
      }
      $key = "$bankIndex,$mapIndex"
      $allMapIndex[$key] = [pscustomobject][ordered]@{
        key = $key
        bank = $bankIndex
        map = $mapIndex
        regionName = $regionName
        headerAddress = $headerAddress
        layoutId = Read-U16 ($headerAddress + 18)
      }
    }
  }

  # Some Sevii maps intentionally retain a blank or old region-section label. Follow
  # links out from directly labelled Sevii maps so those subareas are not omitted.
  # Named non-Sevii destinations form a hard boundary; blank destinations are retained
  # with their seed region and graph distance for later human reconciliation.
  $graphDepthLimit = 1
  $includedMapKeys = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  $directMapKeys = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  $distanceByKey = @{}
  $originsByKey = @{}
  $visitedPaths = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  $queue = [Collections.Generic.Queue[object]]::new()
  $edgeCache = @{}

  function Get-MapTargetKeys([string]$Key) {
    if ($edgeCache.ContainsKey($Key)) {
      return @($edgeCache[$Key])
    }
    $targets = [Collections.Generic.List[string]]::new()
    if ($allMapIndex.ContainsKey($Key)) {
      $indexed = $allMapIndex[$Key]
      $mapModel = $allMaps[$indexed.bank][$indexed.map]
      if ($null -ne $mapModel) {
        foreach ($warp in $mapModel.Events.Warps) {
          $targets.Add("$($warp.Bank),$($warp.Map)")
        }
        try {
          foreach ($connection in $mapModel.Connections) {
            $targets.Add("$($connection.MapGroup),$($connection.MapNum)")
          }
        } catch {
          # Invalid or unused map headers can expose malformed connection tables.
        }
      }
    }
    $uniqueTargets = @($targets | Select-Object -Unique)
    $edgeCache[$Key] = $uniqueTargets
    return $uniqueTargets
  }

  foreach ($entry in $allMapIndex.Values) {
    if ($seviiRegionNames -notcontains $entry.regionName) {
      continue
    }
    $null = $includedMapKeys.Add($entry.key)
    $null = $directMapKeys.Add($entry.key)
    $distanceByKey[$entry.key] = 0
    $originsByKey[$entry.key] = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
    $null = $originsByKey[$entry.key].Add($entry.regionName)
    $null = $visitedPaths.Add("$($entry.key)|$($entry.regionName)")
    $queue.Enqueue([pscustomobject]@{ key = $entry.key; origin = $entry.regionName; distance = 0 })
  }

  while ($queue.Count -gt 0) {
    $path = $queue.Dequeue()
    if ($path.distance -ge $graphDepthLimit) {
      continue
    }
    foreach ($targetKey in @(Get-MapTargetKeys $path.key)) {
      if (-not $allMapIndex.ContainsKey($targetKey)) {
        continue
      }
      $target = $allMapIndex[$targetKey]
      if (
        -not [string]::IsNullOrWhiteSpace($target.regionName) -and
        $seviiRegionNames -notcontains $target.regionName
      ) {
        continue
      }
      if (
        [string]::IsNullOrWhiteSpace($target.regionName) -and
        @(Get-MapTargetKeys $targetKey) -notcontains $path.key
      ) {
        continue
      }

      $targetDistance = $path.distance + 1
      $null = $includedMapKeys.Add($targetKey)
      if (-not $distanceByKey.ContainsKey($targetKey) -or $targetDistance -lt $distanceByKey[$targetKey]) {
        $distanceByKey[$targetKey] = $targetDistance
      }
      if (-not $originsByKey.ContainsKey($targetKey)) {
        $originsByKey[$targetKey] = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
      }
      $null = $originsByKey[$targetKey].Add($path.origin)

      $visitKey = "$targetKey|$($path.origin)"
      if ($visitedPaths.Add($visitKey)) {
        $queue.Enqueue([pscustomobject]@{
          key = $targetKey
          origin = $path.origin
          distance = $targetDistance
        })
      }
    }
  }

  $mapLookup = @{}
  $maps = [Collections.Generic.List[object]]::new()
  foreach ($key in ($includedMapKeys | Sort-Object { [int]($_.Split(',')[0]) }, { [int]($_.Split(',')[1]) })) {
      $indexedMap = $allMapIndex[$key]
      $bankIndex = $indexedMap.bank
      $mapIndex = $indexedMap.map
      $headerAddress = $indexedMap.headerAddress
      $regionName = $indexedMap.regionName
      $inferredRegions = @($originsByKey[$key] | Sort-Object)
      $effectiveRegionName = $regionName
      if ([string]::IsNullOrWhiteSpace($effectiveRegionName)) {
        if ($inferredRegions.Count -eq 1) {
          $effectiveRegionName = $inferredRegions[0]
        } else {
          $effectiveRegionName = "Unresolved Sevii-linked map"
        }
      }

      $mapRecord = [ordered]@{
        key = $key
        bank = $bankIndex
        map = $mapIndex
        regionName = $effectiveRegionName
        romRegionName = $regionName
        inferredRegions = $inferredRegions
        directSeviiLabel = $directMapKeys.Contains($key)
        graphDistance = $distanceByKey[$key]
        layoutId = $indexedMap.layoutId
        headerAddress = "0x{0:X}" -f $headerAddress
        eventsAddress = "0x{0:X}" -f (Read-Pointer ($headerAddress + 4))
        scriptsAddress = "0x{0:X}" -f (Read-Pointer ($headerAddress + 8))
        objectCount = 0
        warpCount = 0
        scriptEventCount = 0
        signpostCount = 0
        width = $null
        height = $null
        mapType = $null
        cave = $null
        weather = $null
        floorNum = $null
        showMapName = $null
        warps = @()
        connections = @()
      }

      $mapModel = $allMaps[$bankIndex][$mapIndex]
      if ($null -ne $mapModel) {
        $mapRecord.objectCount = $mapModel.Events.Objects.Count
        $mapRecord.warpCount = $mapModel.Events.Warps.Count
        $mapRecord.scriptEventCount = $mapModel.Events.Scripts.Count
        $mapRecord.signpostCount = $mapModel.Events.Signposts.Count
        $mapRecord.width = $mapModel.Layout.Width
        $mapRecord.height = $mapModel.Layout.Height
        $mapRecord.mapType = Get-MapHeaderValue $mapModel "mapType"
        $mapRecord.cave = Get-MapHeaderValue $mapModel "cave"
        $mapRecord.weather = Get-MapHeaderValue $mapModel "weather"
        $mapRecord.floorNum = Get-MapHeaderValue $mapModel "floorNum"
        $mapRecord.showMapName = Get-MapHeaderValue $mapModel "showMapName"
        $mapRecord.warps = @(
          $mapModel.Events.Warps | ForEach-Object {
            [pscustomobject][ordered]@{
              x = $_.X
              y = $_.Y
              elevation = $_.Elevation
              warpId = $_.WarpID
              targetKey = "$($_.Bank),$($_.Map)"
              targetBank = $_.Bank
              targetMap = $_.Map
              targetRegionName = Get-MapRegionName $_.Bank $_.Map
            }
          }
        )
        try {
          $mapRecord.connections = @(
            $mapModel.Connections | ForEach-Object {
              [pscustomobject][ordered]@{
                direction = $_.Direction.ToString()
                offset = $_.Offset
                targetKey = "$($_.MapGroup),$($_.MapNum)"
                targetBank = $_.MapGroup
                targetMap = $_.MapNum
                targetRegionName = Get-MapRegionName $_.MapGroup $_.MapNum
              }
            }
          )
        } catch {
          $mapRecord.connections = @()
        }
      }
      $mapObject = [pscustomobject]$mapRecord
      $mapLookup[$key] = $mapObject
      $maps.Add($mapObject)
  }

  $grassProbabilities = @(20, 20, 10, 10, 10, 10, 5, 5, 4, 4, 1, 1)
  $fiveSlotProbabilities = @(60, 30, 5, 4, 1)
  $fishProbabilities = @(70, 30, 60, 20, 20, 40, 40, 15, 4, 1)
  $wildEncounters = [Collections.Generic.List[object]]::new()

  for ($recordIndex = 0; $recordIndex -lt $wildTable.Count; $recordIndex++) {
    $record = $wildTable[$recordIndex]
    $bankIndex = $record.GetValue("bank")
    $mapIndex = $record.GetValue("map")
    $key = "$bankIndex,$mapIndex"
    if (-not $mapLookup.ContainsKey($key)) {
      continue
    }

    foreach ($slotDefinition in @(
      [pscustomobject]@{ field = "grass"; method = "Wild"; count = 12; probabilities = $grassProbabilities },
      [pscustomobject]@{ field = "tree"; method = "Tree/Rock ROM slot"; count = 5; probabilities = $fiveSlotProbabilities },
      [pscustomobject]@{ field = "surf"; method = "Surf"; count = 5; probabilities = $fiveSlotProbabilities },
      [pscustomobject]@{ field = "fish"; method = "Fish"; count = 10; probabilities = $fishProbabilities }
    )) {
      try {
        $headerAddress = $record.GetAddress($slotDefinition.field)
      } catch {
        $headerAddress = -1
      }
      if ($headerAddress -lt 0 -or $headerAddress + 8 -gt $romBytes.Length) {
        continue
      }

      $encounterRate = [int]$romBytes[$headerAddress]
      $listAddress = Read-Pointer ($headerAddress + 4)
      if ($listAddress -lt 0 -or $listAddress + ($slotDefinition.count * 4) -gt $romBytes.Length) {
        continue
      }

      $entries = [Collections.Generic.List[object]]::new()
      for ($slotIndex = 0; $slotIndex -lt $slotDefinition.count; $slotIndex++) {
        $entryAddress = $listAddress + ($slotIndex * 4)
        $speciesId = Read-U16 ($entryAddress + 2)
        $rod = $null
        if ($slotDefinition.field -eq "fish") {
          if ($slotIndex -lt 2) {
            $rod = "Old Rod"
          } elseif ($slotIndex -lt 5) {
            $rod = "Good Rod"
          } else {
            $rod = "Super Rod"
          }
        }
        $entries.Add([pscustomobject][ordered]@{
          slot = $slotIndex
          probability = $slotDefinition.probabilities[$slotIndex]
          rod = $rod
          minLevel = [int]$romBytes[$entryAddress]
          maxLevel = [int]$romBytes[$entryAddress + 1]
          speciesId = $speciesId
          pokemon = Resolve-Pokemon $speciesId
        })
      }

      $wildEncounters.Add([pscustomobject][ordered]@{
        encounterRecordIndex = $recordIndex
        mapKey = $key
        regionName = $mapLookup[$key].regionName
        layoutId = $mapLookup[$key].layoutId
        sourceField = $slotDefinition.field
        method = $slotDefinition.method
        encounterRate = $encounterRate
        headerAddress = "0x{0:X}" -f $headerAddress
        listAddress = "0x{0:X}" -f $listAddress
        entries = $entries
      })
    }
  }

  function Read-Trainer([int]$TrainerId) {
    $address = $trainerTableStart + ($TrainerId * 40)
    if ($address -lt 0 -or $address + 40 -gt $romBytes.Length) {
      return [pscustomobject]@{ id = $TrainerId; valid = $false }
    }

    $structType = [int]$romBytes[$address]
    $classId = [int]$romBytes[$address + 1]
    $partySize = [int]$romBytes[$address + 32]
    $partyAddress = Read-Pointer ($address + 36)
    $name = Read-GameText ($address + 4) 12
    $className = if ($classId -ge 0 -and $classId -lt $trainerClasses.Count) {
      $trainerClasses[$classId].GetStringValue("name")
    } else {
      "Unknown class $classId"
    }

    $valid = $structType -le 3 -and $partySize -ge 1 -and $partySize -le 6 -and $partyAddress -ge 0
    $party = [Collections.Generic.List[object]]::new()
    if ($valid) {
      $itemsIncluded = ($structType -band 2) -ne 0
      $movesIncluded = ($structType -band 1) -ne 0
      $entryLength = if ($movesIncluded) { 16 } else { 8 }
      for ($partyIndex = 0; $partyIndex -lt $partySize; $partyIndex++) {
        $entryAddress = $partyAddress + ($partyIndex * $entryLength)
        if ($entryAddress -lt 0 -or $entryAddress + $entryLength -gt $romBytes.Length) {
          break
        }
        $speciesId = Read-U16 ($entryAddress + 4)
        $heldItemId = if ($itemsIncluded) { Read-U16 ($entryAddress + 6) } else { 0 }
        $moveOffset = if ($itemsIncluded) { 8 } else { 6 }
        $moves = [Collections.Generic.List[object]]::new()
        if ($movesIncluded) {
          for ($moveIndex = 0; $moveIndex -lt 4; $moveIndex++) {
            $moveId = Read-U16 ($entryAddress + $moveOffset + ($moveIndex * 2))
            if ($moveId -ne 0) {
              $moves.Add([pscustomobject]@{ id = $moveId; name = Resolve-Move $moveId })
            }
          }
        }
        $party.Add([pscustomobject][ordered]@{
          slot = $partyIndex + 1
          level = Read-U16 ($entryAddress + 2)
          speciesId = $speciesId
          pokemon = Resolve-Pokemon $speciesId
          heldItemId = if ($itemsIncluded) { $heldItemId } else { $null }
          heldItem = if ($itemsIncluded) { Resolve-Item $heldItemId } else { $null }
          moves = $moves
        })
      }
    }

    return [pscustomobject][ordered]@{
      id = $TrainerId
      valid = $valid
      name = $name
      classId = $classId
      className = $className
      structType = $structType
      isDoubleBattle = ([int]$romBytes[$address + 24]) -ne 0
      partySize = $partySize
      partyAddress = if ($partyAddress -ge 0) { "0x{0:X}" -f $partyAddress } else { $null }
      party = $party
    }
  }

  $trainerRematches = [Collections.Generic.List[object]]::new()
  for ($rematchIndex = 0; $trainerRematchTable -ne $null -and $rematchIndex -lt $trainerRematchTable.Count; $rematchIndex++) {
    $rematchRecord = $trainerRematchTable[$rematchIndex]
    $mapBank = [int]$rematchRecord.GetValue("mapBank")
    $mapNum = [int]$rematchRecord.GetValue("mapNum")
    $mapKey = "$mapBank,$mapNum"
    if (-not $mapLookup.ContainsKey($mapKey)) {
      continue
    }

    $baseTrainerId = [int]$rematchRecord.GetValue("base")
    $stages = [Collections.Generic.List[object]]::new()
    for ($stageIndex = 1; $stageIndex -le 4; $stageIndex++) {
      $trainerId = [int]$rematchRecord.GetValue("rematch$stageIndex")
      if ($trainerId -le 0 -or $trainerId -eq $baseTrainerId) {
        continue
      }
      $stages.Add([pscustomobject][ordered]@{
        stage = $stageIndex
        trainer = Read-Trainer $trainerId
      })
    }

    $trainerRematches.Add([pscustomobject][ordered]@{
      rematchTableIndex = $rematchIndex
      mapKey = $mapKey
      regionName = $mapLookup[$mapKey].regionName
      baseTrainer = Read-Trainer $baseTrainerId
      stages = $stages
    })
  }

  $trainerBattles = [Collections.Generic.List[object]]::new()
  $hiddenItems = [Collections.Generic.List[object]]::new()
  $visibleItems = [Collections.Generic.List[object]]::new()

  foreach ($mapRecord in $maps) {
    $mapModel = $allMaps[$mapRecord.bank][$mapRecord.map]
    if ($null -eq $mapModel) {
      continue
    }

    foreach ($signpost in $mapModel.Events.Signposts) {
      if (-not $signpost.IsHiddenItem) {
        continue
      }
      $itemId = $signpost.ItemValue
      $hiddenItems.Add([pscustomobject][ordered]@{
        mapKey = $mapRecord.key
        regionName = $mapRecord.regionName
        layoutId = $mapRecord.layoutId
        x = $signpost.X
        y = $signpost.Y
        coordinateValid = $signpost.X -ge 0 -and $signpost.Y -ge 0 -and $signpost.X -lt $mapRecord.width -and $signpost.Y -lt $mapRecord.height
        elevation = $signpost.Elevation
        kind = $signpost.Kind
        itemId = $itemId
        item = Resolve-Item $itemId
        quantity = $signpost.HiddenItemCount
        hiddenItemFlag = $signpost.HiddenItemFlag
      })
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
          coordinateValid = $objectEvent.X -ge 0 -and $objectEvent.Y -ge 0 -and $objectEvent.X -lt $mapRecord.width -and $objectEvent.Y -lt $mapRecord.height
          elevation = $objectEvent.Elevation
          itemId = $itemId
          item = Resolve-Item $itemId
          objectFlag = $objectEvent.Element.GetValue("flag")
          scriptAddress = "0x{0:X}" -f $objectEvent.ScriptAddress
        })
      }

      if ($objectEvent.ScriptAddress -lt 0) {
        continue
      }
      try {
        $spots = [HavenSoft.HexManiac.Core.ViewModels.Map.Flags]::GetAllScriptSpots(
          [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
          $scriptParser,
          [int[]]@($objectEvent.ScriptAddress),
          [byte[]]@(0x5C)
        )
      } catch {
        continue
      }

      foreach ($spot in $spots) {
        $commandAddress = $spot.Address
        if ($commandAddress -lt 0 -or $commandAddress + 4 -gt $romBytes.Length) {
          continue
        }
        $trainerId = Read-U16 ($commandAddress + 2)
        if ($trainerId -lt 0 -or $trainerId -gt 2000) {
          continue
        }
        $trainerBattles.Add([pscustomobject][ordered]@{
          mapKey = $mapRecord.key
          regionName = $mapRecord.regionName
          layoutId = $mapRecord.layoutId
          x = $objectEvent.X
          y = $objectEvent.Y
          coordinateValid = $objectEvent.X -ge 0 -and $objectEvent.Y -ge 0 -and $objectEvent.X -lt $mapRecord.width -and $objectEvent.Y -lt $mapRecord.height
          elevation = $objectEvent.Elevation
          objectId = $objectEvent.Element.GetValue("id")
          objectFlag = $objectEvent.Element.GetValue("flag")
          trainerType = $objectEvent.Element.GetValue("trainerType")
          trainerRange = $objectEvent.Element.GetValue("trainerRangeOrBerryID")
          objectScriptAddress = "0x{0:X}" -f $objectEvent.ScriptAddress
          commandAddress = "0x{0:X}" -f $commandAddress
          battleType = [int]$romBytes[$commandAddress + 1]
          trainer = Read-Trainer $trainerId
        })
      }
    }
  }

  $trainerBattles = @(
    $trainerBattles |
      Sort-Object mapKey, x, y, commandAddress, @{ Expression = { $_.trainer.id } } -Unique
  )

  # Memorial Pillar's stronger Elite Four scripts are gated by 0x1686. Audit
  # every overworld object that sets it or one of its prerequisite flags so the
  # progression label can be derived from reachable trainer/map evidence.
  $progressionFlagIds = @(0x156F, 0x1685, 0x167B, 0x1642, 0x188E, 0x160D, 0x1681, 0x158A, 0x1686)
  $progressionFlags = [Collections.Generic.List[object]]::new()
  foreach ($mapEntry in @($allMapIndex.Values | Sort-Object bank, map)) {
    $mapModel = $allMaps[$mapEntry.bank][$mapEntry.map]
    if ($null -eq $mapModel) {
      continue
    }
    foreach ($objectEvent in $mapModel.Events.Objects) {
      if ($objectEvent.ScriptAddress -lt 0) {
        continue
      }
      try {
        $flagSpots = [HavenSoft.HexManiac.Core.ViewModels.Map.Flags]::GetAllScriptSpots(
          [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
          $scriptParser,
          [int[]]@($objectEvent.ScriptAddress),
          [byte[]]@(0x29)
        )
      } catch {
        continue
      }
      $matchingFlags = @(
        $flagSpots |
          ForEach-Object {
            $flagId = Read-U16 ($_.Address + 1)
            if ($progressionFlagIds -contains $flagId) {
              [pscustomobject]@{ address = $_.Address; flagId = $flagId }
            }
          } |
          Sort-Object address, flagId -Unique
      )
      if (-not $matchingFlags.Count) {
        continue
      }

      $reachableTrainers = [Collections.Generic.List[object]]::new()
      try {
        $battleSpots = [HavenSoft.HexManiac.Core.ViewModels.Map.Flags]::GetAllScriptSpots(
          [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
          $scriptParser,
          [int[]]@($objectEvent.ScriptAddress),
          [byte[]]@(0x5C)
        )
        foreach ($battleSpot in @($battleSpots | Sort-Object Address -Unique)) {
          $trainerId = Read-U16 ($battleSpot.Address + 2)
          if ($trainerId -ge 0 -and $trainerId -le 2000) {
            $reachableTrainers.Add([pscustomobject][ordered]@{
              commandAddress = "0x{0:X}" -f $battleSpot.Address
              battleType = [int]$romBytes[$battleSpot.Address + 1]
              trainer = Read-Trainer $trainerId
            })
          }
        }
      } catch {
        # The flag setter is still useful even if an adjacent battle script is
        # malformed or uses a command shape the generic parser cannot follow.
      }

      foreach ($matchingFlag in $matchingFlags) {
        $progressionFlags.Add([pscustomobject][ordered]@{
          flagId = "0x{0:X4}" -f $matchingFlag.flagId
          mapKey = $mapEntry.key
          regionName = $mapEntry.regionName
          x = $objectEvent.X
          y = $objectEvent.Y
          objectId = $objectEvent.Element.GetValue("id")
          objectScriptAddress = "0x{0:X}" -f $objectEvent.ScriptAddress
          setFlagAddress = "0x{0:X}" -f $matchingFlag.address
          reachableTrainers = @($reachableTrainers)
        })
      }
    }
  }

  $result = [ordered]@{
    meta = [ordered]@{
      title = "Pokemon Crystal Advance Redux Sevii ROM extraction"
      gameVersion = "2026-07-19"
      extractedAt = (Get-Date).ToUniversalTime().ToString("o")
      romSha256 = $actualSha256
      romSize = $romBytes.Length
      romHeaderTitle = [Text.Encoding]::ASCII.GetString($romBytes, 0xA0, 12).Trim([char]0)
      gameCode = [Text.Encoding]::ASCII.GetString($romBytes, 0xAC, 4)
      extractionTool = "Hex Maniac Advance Core 0.6.1 plus project extraction script"
      notes = @(
        "The ROM itself is not copied into the project.",
        "Map region names are the ROM regionSection labels. Distinct maps sharing a label remain separate by bank/map key and layout ID.",
        "Blank-labelled maps with a reciprocal direct link to a labelled Sevii map are retained for reconciliation; named non-Sevii destinations stop traversal.",
        "Linked maps preserve their direct ROM label, inferred seed regions and minimum graph distance. An inferred parent is not treated as a confirmed user-facing subarea name.",
        "The ROM wild-data field named tree can represent tree or rock interactions; it is deliberately left unresolved as Tree/Rock ROM slot.",
        "Repeated bank/map rows in the wild table are preserved. They may represent seasonal or scripted variants and must not be merged without runtime evidence.",
        "Trainer battle commands reached recursively from an object script are preserved individually. Type 5 is the FireRed rematch-capable command and does not by itself identify a distinct rematch team.",
        $(if ($trainerRematchTable -ne $null) {
          "Staged rematch teams are extracted separately from data.trainers.rematches and retain their base trainer, stage and map key."
        } else {
          "This ROM does not expose HexManiac's stock data.trainers.rematches anchor. Staged rematch teams therefore remain unresolved and are not inferred from type 5 commands."
        }),
        "Visible item detection covers the standard item-ball script shape; hidden signpost items are read directly. Scripted gifts and shops require separate analysis."
      )
    }
    summary = [ordered]@{
      seviiMapCount = $maps.Count
      directlyLabelledSeviiMapCount = $directMapKeys.Count
      linkedUnlabelledMapCount = @($maps | Where-Object { -not $_.directSeviiLabel }).Count
      mapGraphDepthLimit = $graphDepthLimit
      wildMethodRecordCount = $wildEncounters.Count
      trainerBattleCommandCount = $trainerBattles.Count
      trainerRematchRecordCount = $trainerRematches.Count
      trainerRematchStageCount = @($trainerRematches | ForEach-Object { $_.stages }).Count
      progressionFlagSetterCount = $progressionFlags.Count
      hiddenItemCount = $hiddenItems.Count
      hiddenItemCoordinateValidCount = @($hiddenItems | Where-Object coordinateValid).Count
      visibleItemCandidateCount = $visibleItems.Count
      visibleItemCoordinateValidCount = @($visibleItems | Where-Object coordinateValid).Count
    }
    maps = @($maps | Sort-Object bank, map)
    wildEncounters = @($wildEncounters | Sort-Object encounterRecordIndex, sourceField)
    trainerBattles = $trainerBattles
    trainerRematches = @($trainerRematches | Sort-Object mapKey, rematchTableIndex)
    progressionFlags = @($progressionFlags | Sort-Object flagId, mapKey, x, y, setFlagAddress)
    hiddenItems = @($hiddenItems | Sort-Object mapKey, x, y)
    visibleItems = @($visibleItems | Sort-Object mapKey, x, y)
  }

  $resolvedOutputPath = [IO.Path]::GetFullPath($OutputPath)
  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }
  $result | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath $resolvedOutputPath -Encoding utf8
  Write-Output $resolvedOutputPath
} finally {
  [Environment]::CurrentDirectory = $previousCurrentDirectory
  Pop-Location
}
