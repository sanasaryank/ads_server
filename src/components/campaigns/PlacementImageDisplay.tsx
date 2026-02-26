/**
 * PlacementImageDisplay component
 * Displays placement image or video with optional cropping
 * Images are cropped by rect if provided, then aligned to row height
 */

import { memo } from 'react';
import { Box, Typography } from '@mui/material';
import { VideoLibrary as VideoIcon, ImageNotSupported as NoImageIcon } from '@mui/icons-material';
import type { PlacementImageData } from '../../types';

interface PlacementImageDisplayProps {
  imageData: PlacementImageData | null | undefined;
  rowHeight?: number; // Height of the row in pixels (default: 60)
}

export const PlacementImageDisplay = memo<PlacementImageDisplayProps>(
  function PlacementImageDisplay({ imageData, rowHeight = 60 }) {
    // Show placeholder if no image data
    if (!imageData) {
      return (
        <Box
          sx={{
            width: rowHeight,
            height: rowHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'action.hover',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <NoImageIcon sx={{ color: 'text.disabled', fontSize: rowHeight * 0.5 }} />
        </Box>
      );
    }

    // Handle video link
    if (imageData.link) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            height: rowHeight,
            px: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            bgcolor: 'action.hover',
          }}
        >
          <VideoIcon sx={{ color: 'primary.main' }} />
          <Typography
            variant="caption"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {imageData.link}
          </Typography>
        </Box>
      );
    }

    // Handle image
    if (imageData.image) {
      const { rect } = imageData;
      const shouldCrop = rect && rect.width > 0 && rect.height > 0;

      // If cropping is needed with pixel-based rect values
      if (shouldCrop) {
        const aspectRatio = rect.width / rect.height;
        const containerWidth = aspectRatio >= 1 ? rowHeight : rowHeight * aspectRatio;
        const containerHeight = aspectRatio >= 1 ? rowHeight / aspectRatio : rowHeight;

        return (
          <Box
            sx={{
              width: containerWidth,
              height: containerHeight,
              maxWidth: rowHeight,
              maxHeight: rowHeight,
              overflow: 'hidden',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              component="img"
              src={imageData.image}
              alt="Placement"
              sx={{
                position: 'absolute',
                width: `${(rect.width / rect.width) * 100}%`,
                height: 'auto',
                left: `-${(rect.x / rect.width) * 100}%`,
                top: `-${(rect.y / rect.height) * 100}%`,
                objectFit: 'cover',
              }}
              style={{
                clipPath: `inset(${rect.y}px ${0}px ${0}px ${rect.x}px)`,
              }}
            />
          </Box>
        );
      }

      // No cropping - fit to box while maintaining aspect ratio
      return (
        <Box
          sx={{
            width: rowHeight,
            height: rowHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden',
            bgcolor: 'background.paper',
          }}
        >
          <Box
            component="img"
            src={imageData.image}
            alt="Placement"
            sx={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
            }}
          />
        </Box>
      );
    }

    return null;
  }
);
