param(
  [Parameter(Mandatory = $true)]
  [string]$RomPath,

  [string[]]$TargetKeys = @("1,34", "4,47", "4,48", "4,49"),

  [string]$HexManiacDirectory = "$env:LOCALAPPDATA\Temp\hma-0.6.1\app",

  [string]$OutputPath = (Join-Path $PSScriptRoot "..\sources\reports\two-island-inbound-link-trace-2026-09-28.json")
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

$resolvedOutputPath = [IO.Path]::GetFullPath($OutputPath)

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

  function Read-I32([int]$Address) {
    if ($Address -lt 0 -or $Address + 4 -gt $romBytes.Length) {
      return 0
    }
    return [BitConverter]::ToInt32($romBytes, $Address)
  }

  $mapNames = Keep-Object (Get-ModelTable "data.maps.names")
  $mapBanks = Keep-Object (Get-ModelTable "data.maps.banks")
  $targetSet = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  foreach ($targetKey in $TargetKeys) {
    $null = $targetSet.Add($targetKey)
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
      $regionName = if ($nameIndex -ge 0 -and $nameIndex -lt $mapNames.Count) {
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

  foreach ($targetKey in $TargetKeys) {
    if (-not $allMapIndex.ContainsKey($targetKey)) {
      throw "Target map does not exist: $targetKey"
    }
  }

  $inboundLinks = [Collections.Generic.List[object]]::new()
  $selectedOutgoing = @{}
  foreach ($targetKey in $TargetKeys) {
    $selectedOutgoing[$targetKey] = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
  }

  foreach ($sourceMap in @($allMapIndex.Values | Sort-Object bank, map)) {
    $sourceKey = $sourceMap.key
    $headerAddress = $sourceMap.headerAddress
    $eventsAddress = Read-Pointer ($headerAddress + 4)
    if ($eventsAddress -ge 0 -and $eventsAddress + 20 -le $romBytes.Length) {
      $warpCount = [int]$romBytes[$eventsAddress + 1]
      $warpsAddress = Read-Pointer ($eventsAddress + 8)
      if ($warpsAddress -ge 0 -and $warpsAddress + ($warpCount * 8) -le $romBytes.Length) {
        for ($warpIndex = 0; $warpIndex -lt $warpCount; $warpIndex++) {
          $warpAddress = $warpsAddress + ($warpIndex * 8)
          $targetMap = [int]$romBytes[$warpAddress + 6]
          $targetBank = [int]$romBytes[$warpAddress + 7]
          $targetKey = "$targetBank,$targetMap"
          if ($targetSet.Contains($sourceKey)) {
            $null = $selectedOutgoing[$sourceKey].Add($targetKey)
          }
          if (-not $targetSet.Contains($targetKey)) {
            continue
          }
          $inboundLinks.Add([pscustomobject][ordered]@{
            kind = "warp"
            sourceKey = $sourceKey
            sourceRegionName = $sourceMap.regionName
            sourceLayoutId = $sourceMap.layoutId
            sourceX = Read-U16 $warpAddress
            sourceY = Read-U16 ($warpAddress + 2)
            sourceElevation = [int]$romBytes[$warpAddress + 4]
            sourceWarpId = [int]$romBytes[$warpAddress + 5]
            targetKey = $targetKey
          })
        }
      }
    }

    $connectionsAddress = Read-Pointer ($headerAddress + 12)
    if ($connectionsAddress -ge 0 -and $connectionsAddress + 8 -le $romBytes.Length) {
      $connectionCount = [BitConverter]::ToUInt32($romBytes, $connectionsAddress)
      $connectionListAddress = Read-Pointer ($connectionsAddress + 4)
      if ($connectionCount -le 64 -and $connectionListAddress -ge 0 -and $connectionListAddress + ($connectionCount * 12) -le $romBytes.Length) {
        for ($connectionIndex = 0; $connectionIndex -lt $connectionCount; $connectionIndex++) {
          $connectionAddress = $connectionListAddress + ($connectionIndex * 12)
          $targetBank = [int]$romBytes[$connectionAddress + 8]
          $targetMap = [int]$romBytes[$connectionAddress + 9]
          $targetKey = "$targetBank,$targetMap"
          if ($targetSet.Contains($sourceKey)) {
            $null = $selectedOutgoing[$sourceKey].Add($targetKey)
          }
          if (-not $targetSet.Contains($targetKey)) {
            continue
          }
          $inboundLinks.Add([pscustomobject][ordered]@{
            kind = "connection"
            sourceKey = $sourceKey
            sourceRegionName = $sourceMap.regionName
            sourceLayoutId = $sourceMap.layoutId
            direction = [BitConverter]::ToUInt32($romBytes, $connectionAddress)
            offset = Read-I32 ($connectionAddress + 4)
            targetKey = $targetKey
          })
        }
      }
    }
  }

  $links = @($inboundLinks | ForEach-Object {
    $sourceKey = $_.sourceKey
    $targetKey = $_.targetKey
    $_ | Add-Member -NotePropertyName reciprocal -NotePropertyValue $selectedOutgoing[$targetKey].Contains($sourceKey) -PassThru
  } | Sort-Object targetKey, kind, sourceKey, sourceX, sourceY)

  $targetMaps = @($TargetKeys | ForEach-Object {
    $target = $allMapIndex[$_]
    $eventsAddress = Read-Pointer ($target.headerAddress + 4)
    $eventCounts = [ordered]@{
      objects = 0
      warps = 0
      coordinateScripts = 0
      signposts = 0
    }
    $objects = @()
    if ($eventsAddress -ge 0 -and $eventsAddress + 20 -le $romBytes.Length) {
      $eventCounts.objects = [int]$romBytes[$eventsAddress]
      $eventCounts.warps = [int]$romBytes[$eventsAddress + 1]
      $eventCounts.coordinateScripts = [int]$romBytes[$eventsAddress + 2]
      $eventCounts.signposts = [int]$romBytes[$eventsAddress + 3]
      $objectsAddress = Read-Pointer ($eventsAddress + 4)
      if ($objectsAddress -ge 0 -and $objectsAddress + ($eventCounts.objects * 24) -le $romBytes.Length) {
        $objects = @(for ($objectIndex = 0; $objectIndex -lt $eventCounts.objects; $objectIndex++) {
          $objectAddress = $objectsAddress + ($objectIndex * 24)
          [pscustomobject][ordered]@{
            index = $objectIndex
            localId = [int]$romBytes[$objectAddress]
            graphicsId = [int]$romBytes[$objectAddress + 1]
            x = Read-U16 ($objectAddress + 4)
            y = Read-U16 ($objectAddress + 6)
            elevation = [int]$romBytes[$objectAddress + 8]
            movementType = [int]$romBytes[$objectAddress + 9]
            trainerType = Read-U16 ($objectAddress + 12)
            scriptAddress = "0x{0:X}" -f (Read-Pointer ($objectAddress + 16))
            flagId = Read-U16 ($objectAddress + 20)
          }
        })
      }
    }
    [pscustomobject][ordered]@{
      key = $target.key
      regionName = $target.regionName
      layoutId = $target.layoutId
      headerAddress = "0x{0:X}" -f $target.headerAddress
      eventsAddress = "0x{0:X}" -f $eventsAddress
      eventCounts = [pscustomobject]$eventCounts
      objects = $objects
      incomingLinkCount = @($links | Where-Object targetKey -eq $target.key).Count
      outgoingTargetKeys = @($selectedOutgoing[$target.key] | Sort-Object)
    }
  })

  $result = [ordered]@{
    meta = [ordered]@{
      title = "Pokemon Crystal Advance Redux targeted inbound map-link trace"
      gameVersion = "2026-07-19"
      tracedAt = (Get-Date).ToUniversalTime().ToString("o")
      romSha256 = $actualSha256
      extractionTool = "Hex Maniac Advance Core 0.6.1 plus project raw map-link tracer"
      notes = @(
        "The ROM itself is not copied into the project.",
        "This report scans every valid map header but stores only links whose destination is one of the requested target keys.",
        "A link proves that a map header points at a target; it does not by itself prove that the source map or warp is reachable during normal gameplay."
      )
    }
    summary = [ordered]@{
      scannedMapCount = $allMapIndex.Count
      targetMapCount = $TargetKeys.Count
      inboundLinkCount = $links.Count
      reciprocalInboundLinkCount = @($links | Where-Object reciprocal).Count
    }
    targetMaps = $targetMaps
    inboundLinks = $links
  }

  $outputDirectory = Split-Path -Parent $resolvedOutputPath
  if (-not (Test-Path -LiteralPath $outputDirectory)) {
    New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null
  }
  $result | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $resolvedOutputPath -Encoding utf8
  Write-Output $resolvedOutputPath
} finally {
  [Environment]::CurrentDirectory = $previousCurrentDirectory
  Pop-Location
}
