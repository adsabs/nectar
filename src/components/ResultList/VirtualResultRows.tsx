import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { ReactElement, ReactNode, useLayoutEffect, useRef, useState } from 'react';
import { IDocsEntity } from '@/api/search/types';
import { takeSavedRowIndex } from '@/lib/useScrollRestoration';

const ESTIMATED_ROW_HEIGHT = 148;
const OVERSCAN_ROWS = 8;

export interface IVirtualResultRowsProps {
  docs: IDocsEntity[];
  renderRow: (doc: IDocsEntity, index: number) => ReactNode;
}

export const VirtualResultRows = ({ docs, renderRow }: IVirtualResultRowsProps): ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setScrollMargin(containerRef.current.offsetTop);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(document.body);
    return () => {
      window.removeEventListener('resize', measure);
      observer?.disconnect();
    };
  }, [docs.length]);

  const virtualizer = useWindowVirtualizer({
    count: docs.length,
    estimateSize: () => ESTIMATED_ROW_HEIGHT,
    overscan: OVERSCAN_ROWS,
    scrollMargin,
    getItemKey: (index) => docs[index]?.bibcode ?? index,
  });

  const hasRestoredRef = useRef(false);
  useLayoutEffect(() => {
    if (hasRestoredRef.current || docs.length === 0) {
      return;
    }
    hasRestoredRef.current = true;
    const savedIndex = takeSavedRowIndex();
    if (savedIndex !== null && savedIndex > 0 && savedIndex < docs.length) {
      virtualizer.scrollToIndex(savedIndex, { align: 'start' });
    }
  }, [docs.length, virtualizer]);

  return (
    <div ref={containerRef} style={{ position: 'relative', height: `${virtualizer.getTotalSize()}px` }}>
      {virtualizer.getVirtualItems().map((item) => (
        <div
          key={item.key}
          data-index={item.index}
          ref={virtualizer.measureElement}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${item.start - scrollMargin}px)`,
          }}
        >
          {renderRow(docs[item.index], item.index)}
        </div>
      ))}
    </div>
  );
};
