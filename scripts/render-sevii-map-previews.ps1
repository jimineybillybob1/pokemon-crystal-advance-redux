param(
  [Parameter(Mandatory = $true)]
  [string]$RomPath,

  [string]$HexManiacDirectory = "$env:LOCALAPPDATA\Temp\hma-0.6.1\app",

  [string]$ExtractionPath = (Join-Path $PSScriptRoot "..\sources\reports\sevii-rom-extraction.json"),

  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\work\sevii-map-previews")
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
if (-not (Test-Path -LiteralPath $ExtractionPath)) {
  throw "Sevii extraction report not found: $ExtractionPath"
}

$actualSha256 = (Get-FileHash -LiteralPath $RomPath -Algorithm SHA256).Hash
if ($actualSha256 -ne $ExpectedSha256) {
  throw "Unsupported ROM build. Expected SHA-256 $ExpectedSha256 but found $actualSha256."
}

$report = Get-Content -LiteralPath $ExtractionPath -Raw | ConvertFrom-Json
$mapKeys = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
foreach ($map in $report.maps) {
  $null = $mapKeys.Add($map.key)
  foreach ($edge in @($map.warps) + @($map.connections)) {
    if ($null -ne $edge -and -not [string]::IsNullOrWhiteSpace($edge.targetKey)) {
      $null = $mapKeys.Add($edge.targetKey)
    }
  }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$previousCurrentDirectory = [Environment]::CurrentDirectory
Push-Location $HexManiacDirectory
[Environment]::CurrentDirectory = $HexManiacDirectory
try {
  Add-Type -AssemblyName System.Drawing
  Add-Type -Path $HexManiacAssembly

  $romBytes = [IO.File]::ReadAllBytes($RomPath)
  $singletons = [HavenSoft.HexManiac.Core.Models.Singletons]::new(
    [HavenSoft.HexManiac.Core.Models.InstantDispatch]::Instance,
    100000
  )
  $metadata = [HavenSoft.HexManiac.Core.Models.StoredMetadata]::new([string[]]@())
  $model = [HavenSoft.HexManiac.Core.Models.HardcodeTablesModel]::new(
    $singletons,
    $romBytes,
    $metadata,
    $false
  )
  $null = $model.InitializationWorkload.Wait()
  $allMaps = [HavenSoft.HexManiac.Core.Models.Map.AllMapsModel]::Create(
    [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
    $null
  )

  $rendered = [Collections.Generic.List[object]]::new()
  foreach ($key in ($mapKeys | Sort-Object { [int]($_.Split(',')[0]) }, { [int]($_.Split(',')[1]) })) {
    $parts = $key.Split(',')
    $bank = [int]$parts[0]
    $mapNumber = [int]$parts[1]
    $mapModel = $allMaps[$bank][$mapNumber]
    if ($null -eq $mapModel -or $null -eq $mapModel.Layout -or $null -eq $mapModel.Layout.BlockMap.Run) {
      $rendered.Add([pscustomobject]@{ key = $key; status = "no-renderable-layout" })
      continue
    }

    try {
      $run = [HexManiac.Core.Models.Runs.Sprites.BlockmapRun]$mapModel.Layout.BlockMap.Run
      $pixels = [HavenSoft.HexManiac.Core.ViewModels.DataFormats.SpriteDecorator]::BuildSprite(
        [HavenSoft.HexManiac.Core.Models.IDataModel]$model,
        $run
      )
      if ($null -eq $pixels -or $pixels.PixelWidth -le 0 -or $pixels.PixelHeight -le 0) {
        $rendered.Add([pscustomobject]@{ key = $key; status = "empty-render" })
        continue
      }

      $bitmap = [Drawing.Bitmap]::new(
        $pixels.PixelWidth,
        $pixels.PixelHeight,
        [Drawing.Imaging.PixelFormat]::Format32bppArgb
      )
      try {
        $rect = [Drawing.Rectangle]::new(0, 0, $pixels.PixelWidth, $pixels.PixelHeight)
        $bitmapData = $bitmap.LockBits(
          $rect,
          [Drawing.Imaging.ImageLockMode]::WriteOnly,
          [Drawing.Imaging.PixelFormat]::Format32bppArgb
        )
        try {
          $argb = [int[]]::new($pixels.PixelData.Length)
          for ($i = 0; $i -lt $pixels.PixelData.Length; $i++) {
            $color = [int]$pixels.PixelData[$i] -band 0x7FFF
            $red5 = ($color -shr 10) -band 0x1F
            $green5 = ($color -shr 5) -band 0x1F
            $blue5 = $color -band 0x1F
            $red = ($red5 -shl 3) -bor ($red5 -shr 2)
            $green = ($green5 -shl 3) -bor ($green5 -shr 2)
            $blue = ($blue5 -shl 3) -bor ($blue5 -shr 2)
            $argb[$i] = [int](0xFF000000 -bor ($red -shl 16) -bor ($green -shl 8) -bor $blue)
          }
          [Runtime.InteropServices.Marshal]::Copy($argb, 0, $bitmapData.Scan0, $argb.Length)
        } finally {
          $bitmap.UnlockBits($bitmapData)
        }

        $fileName = "map-{0:D2}-{1:D3}.png" -f $bank, $mapNumber
        $outputPath = Join-Path $OutputDirectory $fileName
        $bitmap.Save($outputPath, [Drawing.Imaging.ImageFormat]::Png)
        $rendered.Add([pscustomobject]@{
          key = $key
          status = "rendered"
          width = $pixels.PixelWidth
          height = $pixels.PixelHeight
          file = $fileName
        })
      } finally {
        $bitmap.Dispose()
      }
    } catch {
      $rendered.Add([pscustomobject]@{ key = $key; status = "error"; error = $_.Exception.Message })
    }
  }

  $manifestPath = Join-Path $OutputDirectory "manifest.json"
  $rendered | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $manifestPath -Encoding UTF8
  $rendered | Group-Object status | Sort-Object Name | ForEach-Object {
    "{0}: {1}" -f $_.Name, $_.Count
  }
  "Manifest: $manifestPath"
} finally {
  [Environment]::CurrentDirectory = $previousCurrentDirectory
  Pop-Location
}
