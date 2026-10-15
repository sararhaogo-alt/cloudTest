$ErrorActionPreference = 'Stop'
$html = [System.IO.File]::ReadAllText('c:\Users\AdminUser\Desktop\test\index.html', [System.Text.Encoding]::UTF8)
$css = [System.IO.File]::ReadAllText('c:\Users\AdminUser\Desktop\test\style.css', [System.Text.Encoding]::UTF8)
$dataJs = [System.IO.File]::ReadAllText('c:\Users\AdminUser\Desktop\test\architecture-data.js', [System.Text.Encoding]::UTF8)
$simJs = [System.IO.File]::ReadAllText('c:\Users\AdminUser\Desktop\test\simulator.js', [System.Text.Encoding]::UTF8)
$authJs = [System.IO.File]::ReadAllText('c:\Users\AdminUser\Desktop\test\auth.js', [System.Text.Encoding]::UTF8)
$appJs = [System.IO.File]::ReadAllText('c:\Users\AdminUser\Desktop\test\app.js', [System.Text.Encoding]::UTF8)

# Replace CSS link
$html = $html.Replace('<link rel="stylesheet" href="style.css">', "<style>`n$css`n</style>")

# Replace JS links
$allJs = "<script>`n$dataJs`n`n$simJs`n`n$authJs`n`n$appJs`n</script>"
$html = $html.Replace('<script src="auth.js"></script>', '')
$html = $html.Replace('<script src="architecture-data.js"></script>', '')
$html = $html.Replace('<script src="simulator.js"></script>', '')
$html = $html.Replace('<script src="app.js"></script>', $allJs)

[System.IO.File]::WriteAllText('c:\Users\AdminUser\Desktop\test\google_script_index.html', $html, [System.Text.Encoding]::UTF8)
Write-Output "Successfully generated google_script_index.html"
