param([string]$stage="dev")

$ErrorActionPreference="Stop"

Write-Output "Deploying to: $stage"

Write-Output "Transpiling code"
npm run transpile

Write-Output "Deleting dist folder"
rm -R -Force dist

Write-Output "Copying transpiled code to dist folder"
cp -R transpiled dist/transpiled

Write-Output "Copying package.json to dist folder"
cp package.json dist/package.json
# node -e "var fs = require('fs'); var a = require('./package.json'); delete a.devDependencies; fs.writeFileSync('dist/package.json', JSON.stringify(a))"

Write-Output "Copying $($stage).env.json to dist folder"
cp "$($stage).env.json" dist/.env.json

Write-Output "Deploying"
gcloud beta functions deploy "pundit-edmond-bot-$stage" --region=us-central1 --stage-bucket bus-eta-bot-src `
--entry-point main --local-path dist --memory 512MB --timeout 60 --trigger-http
