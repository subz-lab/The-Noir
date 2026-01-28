# PowerShell script to apply Elasticsearch index template

Write-Host "Applying Elasticsearch index template..." -ForegroundColor Cyan

# Wait for Elasticsearch to be ready
Write-Host "Waiting for Elasticsearch to be ready..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0

while ($attempt -lt $maxAttempts) {
    try {
        $health = Invoke-RestMethod -Uri "http://localhost:9200/_cluster/health" -Method Get -ErrorAction Stop
        if ($health.status -eq "green" -or $health.status -eq "yellow") {
            Write-Host "✓ Elasticsearch is ready!" -ForegroundColor Green
            break
        }
    }
    catch {
        # Elasticsearch not ready yet
    }
    
    $attempt++
    Start-Sleep -Seconds 2
}

if ($attempt -eq $maxAttempts) {
    Write-Host "✗ Elasticsearch did not become ready in time" -ForegroundColor Red
    exit 1
}

# Apply the index template
Write-Host "`nApplying index template..." -ForegroundColor Cyan

$templatePath = "elasticsearch\index-template.json"
$template = Get-Content $templatePath -Raw

try {
    $response = Invoke-RestMethod -Uri "http://localhost:9200/_index_template/security-logs-template" `
        -Method Put `
        -ContentType "application/json" `
        -Body $template `
        -ErrorAction Stop
    
    Write-Host "✓ Index template applied successfully!" -ForegroundColor Green
}
catch {
    Write-Host "✗ Failed to apply template: $_" -ForegroundColor Red
    exit 1
}

# Verify template
Write-Host "`nVerifying template..." -ForegroundColor Cyan
try {
    $verification = Invoke-RestMethod -Uri "http://localhost:9200/_index_template/security-logs-template" -Method Get
    Write-Host "✓ Template verified!" -ForegroundColor Green
    Write-Host "`nTemplate details:" -ForegroundColor Yellow
    $verification | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "✗ Failed to verify template: $_" -ForegroundColor Red
}
