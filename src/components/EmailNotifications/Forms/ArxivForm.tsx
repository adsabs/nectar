import { IADSApiAddNotificationParams, useAddNotification } from '@api';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Input,
  FormControl,
  FormLabel,
  HStack,
  Button,
  Checkbox,
  Flex,
  IconButton,
  useToast,
  Text,
} from '@chakra-ui/react';
import { noop, parseAPIError } from '@utils';

import { has, keys, toPairs, uniq, without } from 'ramda';
import { ChangeEvent, useState } from 'react';
import { arxivModel } from '../ArxivModel';

export const ArxivForm = ({ onClose, onUpdated = noop }: { onClose: () => void; onUpdated?: () => void }) => {
  const toast = useToast({ duration: 2000 });

  const [keywords, setKeywords] = useState('');

  const [selected, setSelected] = useState<string[]>([]);

  const { mutate: addNotification, isLoading } = useAddNotification();

  const handleKeywordsChange = (e: ChangeEvent<HTMLInputElement>) => {
    setKeywords(e.target.value);
  };

  const handleToggleSelect = (key: string) => {
    // if a parent node
    if (has(key, arxivModel) && !!arxivModel[key].children && keys(arxivModel[key].children).length > 0) {
      const children = [...keys(arxivModel[key].children)];
      const someSelected = children.some((k) => selected.includes(k));
      // some or all children selected, remove all
      if (someSelected) {
        // remove all children
        setSelected((prev) => without(children, prev));
      } else {
        // no children selected, select all children
        setSelected((prev) => uniq([...prev, ...children]));
      }
    } else {
      if (selected.includes(key)) {
        setSelected((prev) => prev.filter((k) => k !== key));
      } else {
        setSelected((prev) => [...prev, key]);
      }
    }
  };

  const handleAddNotification = () => {
    const params: IADSApiAddNotificationParams = {
      type: 'template',
      template: 'arxiv',
      data: keywords.trim().length === 0 ? null : keywords,
      classes: [...selected],
    };

    // for categories, select parents instead if all childrens are selected
    toPairs(arxivModel).forEach(([k, v]) => {
      if (keys(v.children).length > 0 && keys(v.children).every((ckey) => selected.includes(ckey))) {
        // all children are selected, remove all and add parent
        params.classes = [...without(keys(v.children), params.classes), k];
      }
    });

    addNotification(params, {
      onSettled(data, error) {
        if (error) {
          toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
        } else {
          toast({ status: 'success', title: 'Notification Created' });
          onClose();
          onUpdated();
        }
      },
    });
  };

  return (
    <Flex direction="column" gap={4}>
      <Text fontSize="larger">Daily updates from arXiv.org</Text>
      <FormControl>
        <FormLabel>Keywords (optional)</FormLabel>
        <Input onChange={handleKeywordsChange} value={keywords} autoFocus placeholder="star OR planet" />
        <Text fontSize="sm" fontStyle="italic" mt={1}>
          Used to rank papers from selected arXiv categories (below). Boolean "AND" is assumed, but can be overriden by
          using explicit logical operators between keywords
        </Text>
      </FormControl>
      <FormControl>
        <FormLabel>arXiv Categories (must choose at least one)</FormLabel>
        <Categories selected={selected} onToggleSelect={handleToggleSelect} />
      </FormControl>
      <HStack mt={4} justifyContent="end">
        <Button isLoading={isLoading} onClick={handleAddNotification} isDisabled={selected.length === 0}>
          Submit
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </HStack>
    </Flex>
  );
};

/**
 *
 * The selection is based on the followings:
 * - If a node has no children, it can be marked as checked or unchecked
 * - If a node has children, it is not marked, but its value (checked, unchecked, indeterminate)
 *   is based on the states of its children.
 */
const Categories = ({ selected, onToggleSelect }: { selected: string[]; onToggleSelect: (key: string) => void }) => {
  const [opened, setOpened] = useState<string[]>([]);

  const handleToggleOpen = (key: string) => {
    if (opened.includes(key)) {
      setOpened(opened.filter((k) => k !== key));
    } else {
      setOpened([...opened, key]);
    }
  };

  return (
    <Box>
      {toPairs(arxivModel).map(([k, v]) => (
        <Flex direction="column">
          <Flex h={8}>
            {keys(v.children).length > 0 && (
              <IconButton
                aria-label={`expand ${v.label}`}
                icon={opened.includes(k) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                variant="unstyled"
                colorScheme="gray"
                onClick={() => handleToggleOpen(k)}
              />
            )}
            <Checkbox
              key={v.key}
              ml={keys(v.children).length > 0 ? 0 : 8}
              isChecked={selected.includes(k) || keys(v.children).some((ch) => selected.includes(ch))}
              isIndeterminate={
                keys(v.children).some((ch) => selected.includes(ch)) &&
                !keys(v.children).every((ch) => selected.includes(ch))
              }
              onChange={() => onToggleSelect(k)}
              name="classes"
              value={v.key}
            >
              {v.label}
            </Checkbox>
          </Flex>
          {opened.includes(k) &&
            toPairs(v.children).map(([chkey, chval]) => (
              <Checkbox
                h={8}
                key={chkey}
                ml={16}
                isChecked={selected.includes(chkey)}
                onChange={() => onToggleSelect(chkey)}
                name="classes"
                value={chval.key}
              >
                {chval.label}
              </Checkbox>
            ))}
        </Flex>
      ))}
    </Box>
  );
};
