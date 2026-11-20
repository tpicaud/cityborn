import { styled, Text, View } from 'tamagui';

type ScoreTableColumns = {
  label: string;
  detail?: string;
  score: string;
};

export type ScoreTableRow = {
  key: string;
  position: number;
  label: string;
  detail?: string;
  score: number;
  highlighted: boolean;
};

type ScoreTableProps = {
  title?: string;
  columns: ScoreTableColumns;
  rows: ScoreTableRow[];
};

const TableFrame = styled(View, {
  gap: '1.5 md:2.5',
});

const TableTitle = styled(Text, {
  role: 'heading',
  px: '1 md:2',
  fontFamily: 'body',
  fontSize: '4 md:7',
  lineHeight: '4 md:7',
  fontWeight: '600',
  color: 'white',
});

const Rows = styled(View, {
  gap: '1 md:1.5',
});

const HeaderLine = styled(View, {
  flexDirection: 'row',
  items: 'center',
});

const RowLine = styled(View, {
  flexDirection: 'row',
  items: 'center',
  h: '9 md:14',
  rounded: 'lg md:xl',
  borderWidth: '1 md:1.5',
  borderColor: 'transparent',
  bg: 'score-table-row',
  variants: {
    highlighted: {
      true: { bg: 'score-table-highlight', borderColor: 'score-accent' },
    },
  } as const,
});

const Cell = styled(Text, {
  fontFamily: 'body',
  fontSize: '2 md:5',
  lineHeight: '2 md:5',
  fontWeight: '500',
  color: 'white',
  numberOfLines: 1,
  variants: {
    column: {
      position: {
        w: '7 md:12',
        text: 'center',
        fontWeight: '700',
        color: 'secondary-cyan',
      },
      label: { flex: 1, minW: '0', ml: '0.75 md:1' },
      detail: { w: '24 md:40', text: 'center' },
      score: {
        w: '20 md:32',
        ml: '3.5 md:7',
        text: 'center',
        fontWeight: '700',
        color: 'secondary-cyan',
      },
    },
    tone: {
      header: { fontWeight: '500', color: 'footnote' },
      highlighted: {
        fontSize: '3 md:6',
        lineHeight: '3 md:6',
        fontWeight: '700',
        color: 'cta-orange',
      },
    },
  } as const,
});

export function ScoreTable({ title, columns, rows }: ScoreTableProps) {
  const hasDetail: boolean = columns.detail !== undefined;

  return (
    <TableFrame>
      {title !== undefined && <TableTitle>{title}</TableTitle>}
      <HeaderLine>
        <Cell column="position" tone="header" />
        <Cell column="label" tone="header">
          {columns.label}
        </Cell>
        {hasDetail && (
          <Cell column="detail" tone="header">
            {columns.detail}
          </Cell>
        )}
        <Cell column="score" tone="header">
          {columns.score}
        </Cell>
      </HeaderLine>
      <Rows>
        {rows.map((row: ScoreTableRow) => {
          const tone: 'highlighted' | undefined = row.highlighted
            ? 'highlighted'
            : undefined;
          return (
            <RowLine key={row.key} highlighted={row.highlighted}>
              <Cell column="position" tone={tone}>
                {row.position}
              </Cell>
              <Cell column="label" tone={tone}>
                {row.label}
              </Cell>
              {hasDetail && (
                <Cell column="detail" tone={tone}>
                  {row.detail}
                </Cell>
              )}
              <Cell column="score" tone={tone}>
                {row.score}
              </Cell>
            </RowLine>
          );
        })}
      </Rows>
    </TableFrame>
  );
}
