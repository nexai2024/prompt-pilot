'use client';

interface VersionDiffProps {
  leftLabel: string;
  rightLabel: string;
  leftContent: string;
  rightContent: string;
}

function computeLineDiff(left: string, right: string) {
  const leftLines = left.split('\n');
  const rightLines = right.split('\n');
  const max = Math.max(leftLines.length, rightLines.length);
  const rows: Array<{
    left: string;
    right: string;
    type: 'same' | 'changed' | 'added' | 'removed';
  }> = [];

  for (let i = 0; i < max; i++) {
    const leftLine = leftLines[i] ?? '';
    const rightLine = rightLines[i] ?? '';

    if (leftLine === rightLine) {
      rows.push({ left: leftLine, right: rightLine, type: 'same' });
    } else if (i >= leftLines.length) {
      rows.push({ left: '', right: rightLine, type: 'added' });
    } else if (i >= rightLines.length) {
      rows.push({ left: leftLine, right: '', type: 'removed' });
    } else {
      rows.push({ left: leftLine, right: rightLine, type: 'changed' });
    }
  }

  return rows;
}

export function VersionDiff({
  leftLabel,
  rightLabel,
  leftContent,
  rightContent,
}: VersionDiffProps) {
  const rows = computeLineDiff(leftContent, rightContent);
  const hasChanges = rows.some((row) => row.type !== 'same');

  if (!hasChanges) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No differences between {leftLabel} and {rightLabel}.
      </p>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden text-xs font-mono">
      <div className="grid grid-cols-2 bg-gray-100 border-b">
        <div className="px-3 py-2 font-semibold text-gray-700">{leftLabel}</div>
        <div className="px-3 py-2 font-semibold text-gray-700 border-l">{rightLabel}</div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {rows.map((row, index) => {
          const bg =
            row.type === 'changed'
              ? 'bg-amber-50'
              : row.type === 'added'
                ? 'bg-green-50'
                : row.type === 'removed'
                  ? 'bg-red-50'
                  : '';

          return (
            <div key={index} className={`grid grid-cols-2 border-b last:border-b-0 ${bg}`}>
              <pre className="px-3 py-1 whitespace-pre-wrap break-words text-gray-800">
                {row.left || ' '}
              </pre>
              <pre className="px-3 py-1 whitespace-pre-wrap break-words text-gray-800 border-l">
                {row.right || ' '}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
