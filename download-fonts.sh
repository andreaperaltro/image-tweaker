#!/bin/bash

# Create fonts directory if it doesn't exist
mkdir -p public/fonts

# Download font files
curl -o public/fonts/PPMondwest-Regular.otf "https://use.typekit.net/af/3f4b44/00000000000000007735c5c2/30/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3"
curl -o public/fonts/PPMondwest-Bold.otf "https://use.typekit.net/af/3f4b44/00000000000000007735c5c2/30/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3"

echo "Font files downloaded successfully!" 