# PowerShell script za Git setup i push
# Pokrenite ovu skriptu nakon sto instalirate Git

Write-Host "Git Setup Script za ABGC Next.js projekat" -ForegroundColor Green
Write-Host ""

# Proveri da li je Git instaliran
try {
    $gitVersion = git --version 2>&1
    Write-Host "Git je instaliran: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "Git nije instaliran!" -ForegroundColor Red
    Write-Host "Molimo instalirajte Git sa: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "Nakon instalacije, restartujte PowerShell i pokrenite ovu skriptu ponovo." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Pritisnite bilo koji taster za izlaz..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Prebacujem se u nextjs folder..." -ForegroundColor Cyan
Set-Location $PSScriptRoot

# Proveri da li je Git vec inicijalizovan
if (Test-Path ".git") {
    Write-Host "Git repozitorijum vec postoji" -ForegroundColor Green
} else {
    Write-Host "Inicijalizujem Git repozitorijum..." -ForegroundColor Cyan
    git init
    Write-Host "Git repozitorijum inicijalizovan" -ForegroundColor Green
}

Write-Host ""
Write-Host "Proveravam status..." -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "Dodajem fajlove..." -ForegroundColor Cyan
git add .

Write-Host ""
Write-Host "Pravim commit..." -ForegroundColor Cyan
$commitMessage = "Initial commit - Next.js ABGC project with CMS, Chat, Profile, and i18n support"
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Greska pri kreiranju commit-a!" -ForegroundColor Red
    Write-Host "Mozda nema promena za commit ili je vec sve commit-ovano." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Commit kreiran!" -ForegroundColor Green
Write-Host ""
Write-Host "Sledeci koraci:" -ForegroundColor Yellow
Write-Host "1. Idite na https://github.com i kreirajte novi repozitorijum" -ForegroundColor White
Write-Host "2. Kopirajte URL repozitorijuma (npr. https://github.com/username/repo-name.git)" -ForegroundColor White
Write-Host "3. Unesite GitHub URL ovde:" -ForegroundColor Yellow
Write-Host ""
$repoUrl = Read-Host "GitHub repository URL"

if ($repoUrl -and $repoUrl.Trim() -ne "") {
    Write-Host ""
    Write-Host "Povezujem sa GitHub repozitorijumom..." -ForegroundColor Cyan
    
    # Proveri da li remote vec postoji
    $existingRemote = git remote get-url origin 2>$null
    if ($existingRemote) {
        Write-Host "Remote 'origin' vec postoji: $existingRemote" -ForegroundColor Yellow
        $overwrite = Read-Host "Da li zelite da ga zamenite? (y/n)"
        if ($overwrite -eq "y" -or $overwrite -eq "Y") {
            git remote set-url origin $repoUrl
            Write-Host "Remote azuriran" -ForegroundColor Green
        } else {
            Write-Host "Preskacem promenu remote-a" -ForegroundColor Yellow
        }
    } else {
        git remote add origin $repoUrl
        Write-Host "Remote dodat" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "Postavljam main branch..." -ForegroundColor Cyan
    git branch -M main
    
    Write-Host ""
    Write-Host "Push-ujem na GitHub..." -ForegroundColor Cyan
    Write-Host "Bice vam potrebni GitHub kredencijali!" -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Uspesno push-ovano na GitHub!" -ForegroundColor Green
        Write-Host "Vas kod je sada na: $repoUrl" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Push nije uspeo. Proverite:" -ForegroundColor Red
        Write-Host "   - Da li su GitHub kredencijali tacni" -ForegroundColor Yellow
        Write-Host "   - Da li repozitorijum postoji" -ForegroundColor Yellow
        Write-Host "   - Da li imate dozvole za push" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Mozete pokusati ponovo sa:" -ForegroundColor Yellow
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "GitHub URL nije unet. Mozete dodati remote kasnije sa:" -ForegroundColor Yellow
    Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git" -ForegroundColor Cyan
    Write-Host "   git branch -M main" -ForegroundColor Cyan
    Write-Host "   git push -u origin main" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Gotovo!" -ForegroundColor Green
