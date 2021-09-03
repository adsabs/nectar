import clsx from "clsx";
import { HTMLAttributes, ReactElement } from "react";
import { ItemType } from "./types";

interface IItemProps extends HTMLAttributes<HTMLButtonElement | HTMLDivElement> {
  item: ItemType;
  classes: string;
}

export const Item = (props: IItemProps): ReactElement => {
  const {
    item: { domId, label },
    classes,
    ...restProps
  } = props;
  const itemClasses = clsx('px-3 py-2 text-left', classes);

  return (
    <button className={itemClasses} type="button" {...restProps} id={domId}>
      {label}
    </button>
  );
};