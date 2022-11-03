import { QuestionIcon, QuestionOutlineIcon } from '@chakra-ui/icons';
import { Box, Collapse, CollapseProps, IconButton, Link as ChakraLink, useDisclosure } from '@chakra-ui/react';
import Link, { LinkProps } from 'next/link';
import { ReactElement, ReactNode } from 'react';

export interface IDescriptionCollapseProps extends CollapseProps {
  label: string;
  linkProps: LinkProps;
  body: ReactNode;
  children: (props: { btn: ReactNode; content: ReactNode }) => ReactNode;
}

export const DescriptionCollapse = (props: IDescriptionCollapseProps): ReactElement => {
  const { label, body, children, ...collapseProps } = props;
  const { isOpen, onToggle } = useDisclosure();

  const icon = isOpen ? <QuestionIcon fontSize="lg" /> : <QuestionOutlineIcon fontSize="lg" />;

  return (
    <>
      {children({
        btn: <IconButton onClick={onToggle} icon={icon} variant="ghost" isRound aria-label={label} />,
        content: (
          <Collapse in={isOpen} {...collapseProps}>
            <Box overflowX="scroll">{body}</Box>
          </Collapse>
        ),
      })}
    </>
  );
};

const Static = (props: IDescriptionCollapseProps): ReactElement => {
  const { linkProps } = props;
  return (
    <Link {...linkProps} legacyBehavior>
      <ChakraLink>
        <QuestionOutlineIcon />
      </ChakraLink>
    </Link>
  );
};

DescriptionCollapse.Static = Static;
