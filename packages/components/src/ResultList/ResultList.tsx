import { IDocsEntity } from '@nectar/api';
import React from 'react';
import { Item } from './Item';
import { Skeleton } from './Skeleton';

type Id = IDocsEntity["id"]
interface IResultDoc extends Partial<IDocsEntity> {
  id: Id
};

export interface IResultListProps {
  docs: IResultDoc[];
  selected: Id[];
  onSelectedChange: (item: Id[]) => void;
  loading: boolean;
}

export const ResultList = (props: IResultListProps): React.ReactElement => {
  const { docs, loading = false, selected, onSelectedChange } = props;

  const [selectedDocs, setSelectedDocs] = React.useState<Id[]>(
    [],
  );

  const handleSelect = (item: Id) => {
    const index = selectedDocs.indexOf(item);
    if (index > -1) {
      setSelectedDocs([
        ...selectedDocs.slice(0, index),
        ...selectedDocs.slice(index + 1),
      ]);
    } else {
      setSelectedDocs([...selectedDocs, item]);
    }
  };

  React.useEffect(() => {
    setSelectedDocs(selected);
  }, [selected]);

  React.useEffect(() => {
    onSelectedChange(selectedDocs);
  }, [selectedDocs]);

  let list;
  if (loading) {
    list = <Skeleton count={10} />;
  } else {
    list = docs.map((doc, index) => (
      <Item
        doc={doc}
        key={doc.id}
        index={index + 1}
        onSelect={handleSelect}
        selected={selectedDocs.includes(doc.id)}
      />
    ));
  }

  return <div className="flex flex-col space-y-1">{list}</div>;
};
