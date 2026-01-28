# Build and Push Docker Images for Finder
# Run this script from the Finder root folder

$DOCKER_USERNAME = "hugogsilva"
$VERSION = "latest"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Building and Pushing Finder Images" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Ensure we're logged into Docker Hub
Write-Host "`nEnsure you are logged into Docker Hub:" -ForegroundColor Yellow
Write-Host "Run: docker login" -ForegroundColor Yellow
Write-Host ""

# Build Backend
Write-Host "`n[1/4] Building Backend..." -ForegroundColor Green
docker build -t "${DOCKER_USERNAME}/finder-backend:${VERSION}" ./backend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend build failed!" -ForegroundColor Red
    exit 1
}

# Build Frontend
Write-Host "`n[2/4] Building Frontend..." -ForegroundColor Green
docker build `
    --build-arg VITE_API_URL=https://finder.hugogsilva.dev/api `
    --build-arg VITE_WS_URL=wss://finder.hugogsilva.dev/ws `
    -t "${DOCKER_USERNAME}/finder-frontend:${VERSION}" ./frontend
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    exit 1
}

# Build Scraper
Write-Host "`n[3/4] Building Scraper..." -ForegroundColor Green
docker build -t "${DOCKER_USERNAME}/finder-scraper:${VERSION}" ./scraper
if ($LASTEXITCODE -ne 0) {
    Write-Host "Scraper build failed!" -ForegroundColor Red
    exit 1
}

# Build Discord Bot
Write-Host "`n[4/4] Building Discord Bot..." -ForegroundColor Green
docker build -t "${DOCKER_USERNAME}/finder-discord:${VERSION}" ./discord-bot
if ($LASTEXITCODE -ne 0) {
    Write-Host "Discord Bot build failed!" -ForegroundColor Red
    exit 1
}

# Build DB Init
Write-Host "`n[5/5] Building DB Init..." -ForegroundColor Green
docker build -t "${DOCKER_USERNAME}/finder-db-init:${VERSION}" ./database
if ($LASTEXITCODE -ne 0) {
    Write-Host "DB Init build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All images built successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Push images
Write-Host "`nPushing images to Docker Hub..." -ForegroundColor Green

docker push "${DOCKER_USERNAME}/finder-backend:${VERSION}"
docker push "${DOCKER_USERNAME}/finder-frontend:${VERSION}"
docker push "${DOCKER_USERNAME}/finder-scraper:${VERSION}"
docker push "${DOCKER_USERNAME}/finder-discord:${VERSION}"
docker push "${DOCKER_USERNAME}/finder-db-init:${VERSION}"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "All images pushed successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Write-Host "`nImages pushed:" -ForegroundColor Yellow
Write-Host "  - ${DOCKER_USERNAME}/finder-backend:${VERSION}"
Write-Host "  - ${DOCKER_USERNAME}/finder-frontend:${VERSION}"
Write-Host "  - ${DOCKER_USERNAME}/finder-scraper:${VERSION}"
Write-Host "  - ${DOCKER_USERNAME}/finder-discord:${VERSION}"
Write-Host "  - ${DOCKER_USERNAME}/finder-db-init:${VERSION}"

Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Go to Portainer" -ForegroundColor White
Write-Host "2. Create a new Stack" -ForegroundColor White
Write-Host "3. Copy the content from docker-compose.portainer.yml" -ForegroundColor White
Write-Host "4. Set environment variables:" -ForegroundColor White
Write-Host "   - DB_PASSWORD=<secure_password>" -ForegroundColor Gray
Write-Host "   - JWT_SECRET=<secure_jwt_secret>" -ForegroundColor Gray
Write-Host "   - DISCORD_TOKEN=<your_discord_bot_token>" -ForegroundColor Gray
Write-Host "5. Deploy the stack" -ForegroundColor White
