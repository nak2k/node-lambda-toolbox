/**
 * Whether the current process is executed in SAM local.
 */
export const LOCAL = process.env.AWS_SAM_LOCAL === 'true';

/**
 * Return whether the media type matches specified patterns.
 * 
 * @param type The media type that is checked.
 * @param patterns Patterns to be matched against the media type.
 * @returns 
 */
export function matchMediaType(type: string, patterns: string[]) {
  return patterns.find(pattern => mediaTypeMatcher(pattern)(type)) !== undefined;
}

function mediaTypeMatcher(mediaType: string): (type: string) => boolean {
  if (mediaType === '*/*') {
    return type => true;
  } else if (mediaType.startsWith('*/')) {
    const t = mediaType.substr(1);
    return type => type.endsWith(t);
  } else if (mediaType.endsWith('/*')) {
    const t = mediaType.slice(0, -1);
    return type => type.startsWith(t);
  } else {
    return type => type === mediaType;
  }
}
