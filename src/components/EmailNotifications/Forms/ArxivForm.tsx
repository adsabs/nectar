import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Text,
  useToast,
} from '@chakra-ui/react';

import { has, keys, toPairs, uniq, without } from 'ramda';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { arxivModel } from '../ArxivModel';
import { isValidKeyword } from './Utils';
import { useDebounce } from '@/lib/useDebounce';
import { noop } from '@/utils/common/noop';
import { parseAPIError } from '@/utils/common/parseAPIError';
import { IADSApiAddNotificationParams, IADSApiEditNotificationParams, INotification } from '@/api/vault/types';
import { useAddNotification, useEditNotification } from '@/api/vault/vault';

export const ArxivForm = ({
  onClose,
  onUpdated = noop,
  notification,
}: {
  onClose: () => void;
  onUpdated?: () => void;
  notification?: INotification;
}) => {
  const toast = useToast({ duration: 2000 });

  const [keywords, setKeywords] = useState(notification?.data ?? '');

  const dbKeywords = useDebounce(keywords);

  const [selected, setSelected] = useState<string[]>([]);

  const [name, setName] = useState<string>(notification?.name ?? '');

  const { kwValid, kwErrorMessage } = useMemo(() => {
    const isValid = isValidKeyword(dbKeywords);
    return { kwValid: isValid, kwErrorMessage: isValid ? null : 'Invalid keyword syntax' };
  }, [dbKeywords]);

  // initialize arxiv selection model
  useEffect(() => {
    if (!!notification) {
      let tempSelectedKeys: string[] = [];
      notification?.classes?.map((key) => {
        // if a parent node, select all of its children
        if (has(key, arxivModel) && !!arxivModel[key].children && keys(arxivModel[key].children).length > 0) {
          tempSelectedKeys = [...tempSelectedKeys, ...keys(arxivModel[key].children)];
        } else {
          tempSelectedKeys.push(key);
        }
      });
      setSelected(tempSelectedKeys);
    }
  }, [notification]);

  const { mutate: addNotification, isLoading: isAdding } = useAddNotification();

  const { mutate: editNofication, isLoading: isEditing } = useEditNotification();

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

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

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // for categories, select parents instead if all childrens are selected
    let classes = [...selected];
    toPairs(arxivModel).forEach(([k, v]) => {
      if (keys(v.children).length > 0 && keys(v.children).every((ckey) => selected.includes(ckey))) {
        // all children are selected, remove all and add parent
        classes = [...without(keys(v.children), classes), k];
      }
    });

    if (!!notification) {
      // edit existing notification
      handleEditNotification({
        id: notification.id,
        data: keywords.trim().length === 0 ? null : keywords,
        name,
        classes,
      });
    } else {
      // add new notification
      handleAddNotification({
        type: 'template',
        template: 'arxiv',
        data: keywords.trim().length === 0 ? null : keywords,
        classes: [...classes],
      });
    }
  };

  const handleAddNotification = (params: IADSApiAddNotificationParams) => {
    addNotification(params, {
      onSettled(_data, error) {
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

  const handleEditNotification = (params: IADSApiEditNotificationParams) => {
    editNofication(params, {
      onSettled(_data, error) {
        if (error) {
          toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
        } else {
          toast({ status: 'success', title: 'Notification Modified' });
          onClose();
          onUpdated();
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap={4} data-testid="create-arxiv-modal">
        <Text fontSize="larger">Daily updates from arXiv.org</Text>
        {notification && (
          <FormControl>
            <FormLabel>Notification Name</FormLabel>
            <Input value={name} onChange={handleNameChange} autoFocus />
          </FormControl>
        )}
        <FormControl isInvalid={!kwValid}>
          <FormLabel>Keywords (optional)</FormLabel>
          <Input onChange={handleKeywordsChange} value={keywords} autoFocus placeholder="star OR planet" />
          <FormErrorMessage>{kwErrorMessage}</FormErrorMessage>
          <Text fontSize="sm" fontStyle="italic" mt={1}>
            Used to rank papers from selected arXiv categories (below). Boolean &#34;AND&#34; is assumed, but can be
            overridden by using explicit logical operators between keywords
          </Text>
        </FormControl>
        <FormControl>
          <FormLabel>arXiv Categories (must choose at least one)</FormLabel>
          <Categories selected={selected} onToggleSelect={handleToggleSelect} />
        </FormControl>
        <HStack mt={4} justifyContent="end">
          <Button isLoading={isAdding || isEditing} isDisabled={selected.length === 0 || !kwValid} type="submit">
            Submit
          </Button>
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
        </HStack>
      </Flex>
    </form>
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
        <Flex direction="column" key={k}>
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
