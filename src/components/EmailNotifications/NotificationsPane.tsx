import {
  INotification,
  NotificationTemplate,
  useDelNotification,
  useEditNotification,
  useGetNotificationQuery,
  useGetNotifications,
} from '@api';
import { ChevronDownIcon, SettingsIcon, SmallCloseIcon } from '@chakra-ui/icons';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useBreakpoint,
  Text,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Switch,
  Flex,
  MenuDivider,
  useToast,
  Input,
  Stack,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  OrderedList,
  ListItem,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { CustomInfoMessage } from '@components/Feedbacks';
import { TableSkeleton } from '@components/Libraries/TableSkeleton';
import { TimeSince } from '@components/TimeSince';
import { useColorModeColors, useDebounce } from '@lib';
import { makeSearchParams, parseAPIError } from '@utils';
import { useRouter } from 'next/router';
import { values } from 'ramda';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AddNotificationModal } from './AddNotificationModal';
import { DeleteNotificationMenuItem } from './DeleteNotificationMenuItem';

export const NotificationsPane = () => {
  const toast = useToast({ duration: 2000 });

  const breakpoint = useBreakpoint();

  const isMobile = ['base', 'xs', 'sm'].includes(breakpoint, 0);

  const colors = useColorModeColors();

  const { data: notifications, isLoading, error, refetch, remove } = useGetNotifications();

  const { mutate: editNotification } = useEditNotification();

  const { mutate: deleteNotification } = useDelNotification();

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();

  const [addTemplate, setAddTemplate] = useState<NotificationTemplate>();

  const [editingNotification, setEditingNotification] = useState<INotification['id']>(null);

  const [searchVal, setSearchVal] = useState('');

  const debSearchVal = useDebounce(searchVal, 500);

  const filteredNotifications = useMemo(() => {
    if (notifications) {
      return debSearchVal.length === 0
        ? [...notifications]
        : notifications.filter((n) =>
            values(n).some(
              (v) =>
                (typeof v === 'string' && v.toLowerCase().indexOf(debSearchVal) !== -1) ||
                (Array.isArray(v) && (v as Array<string>).some((vv) => vv.indexOf(debSearchVal) !== -1)),
            ),
          );
    }
  }, [notifications, debSearchVal]);

  // reset add/edit modal when modal closes
  useEffect(() => {
    if (!isCreateOpen) {
      setEditingNotification(null);
    }
  }, [isCreateOpen]);

  const handleSearchValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value.toLowerCase());
  };

  const handleSetActive = (id: INotification['id'], active: boolean) => {
    editNotification(
      { id, active },
      {
        onSettled(data, error) {
          if (error) {
            toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
          } else {
            toast({ status: 'success', title: 'Notification modified' });
            remove();
            void refetch();
          }
        },
      },
    );
  };

  const handleOpenCreate = (template?: NotificationTemplate) => {
    setAddTemplate(template);
    onCreateOpen();
  };

  const handleOpenEdit = (id: INotification['id']) => {
    setEditingNotification(id);
    onCreateOpen();
  };

  const handleDelete = (id: INotification['id']) => {
    deleteNotification(
      { id },
      {
        onSettled(data, error) {
          if (error) {
            toast({ status: 'error', title: 'Error', description: parseAPIError(error) });
          } else {
            toast({ status: 'success', title: 'Notification Deleted' });
            reload();
          }
        },
      },
    );
  };

  const handleClearSearch = () => {
    setSearchVal('');
  };

  const reload = () => {
    remove();
    void refetch();
  };

  return (
    <>
      <Flex direction="column" gap={4}>
        <Flex direction={{ base: 'column', md: 'row' }} justifyContent={{ base: 'start', md: 'space-between' }} gap={2}>
          <Stack w="300px">
            <InputGroup>
              <Input placeholder="search" value={searchVal} onChange={handleSearchValueChange} />
              <InputRightElement>
                <IconButton icon={<SmallCloseIcon />} aria-label="clear" onClick={handleClearSearch} variant="ghost" />
              </InputRightElement>
            </InputGroup>
          </Stack>
          <Menu>
            <MenuButton as={Button} rightIcon={<ChevronDownIcon />} variant="outline">
              Create
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => handleOpenCreate('arxiv')}>arXiv</MenuItem>
              <MenuItem onClick={() => handleOpenCreate('citations')}>Citations</MenuItem>
              <MenuItem onClick={() => handleOpenCreate('authors')}>Authors</MenuItem>
              <MenuItem onClick={() => handleOpenCreate('keyword')}>Keyword</MenuItem>
              <CreateQueryNotificationMenuItem />
            </MenuList>
          </Menu>
        </Flex>

        {isLoading && <TableSkeleton r={8} h="30px" />}
        {error && (
          <CustomInfoMessage status="error" title="Error fetching notifications" description={parseAPIError(error)} />
        )}
        {!isLoading && (
          <>
            {!notifications || notifications.length === 0 ? (
              <CustomInfoMessage
                status="info"
                title="No Email Notifications"
                description="Click create to start adding email notifications"
              />
            ) : filteredNotifications && filteredNotifications.length === 0 ? (
              <CustomInfoMessage status="info" title="No Notifications Found" />
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th></Th>
                    <Th w="30%">Name</Th>
                    <Th>Type</Th>
                    <Th>Frequency</Th>
                    <Th>Updated</Th>
                    {!isMobile && <Th>Actions</Th>}
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredNotifications.map((n, i) => (
                    <Tr
                      key={`notification-${n.id}`}
                      backgroundColor={n.active ? 'transparent' : colors.disabledBackground}
                      color={n.active ? colors.text : colors.disabledForeground}
                    >
                      <Td>{i + 1}</Td>
                      <Td>{n.name}</Td>
                      <Td>{n.type === 'template' ? n.template : 'query'}</Td>
                      <Td>{n.frequency}</Td>
                      <Td>
                        <TimeSince date={n.updated} />
                      </Td>
                      {!isMobile && (
                        <Td>
                          <Action
                            notification={n}
                            onSetActive={(active) => handleSetActive(n.id, active)}
                            onEdit={() => handleOpenEdit(n.id)}
                            onDelete={() => handleDelete(n.id)}
                          />
                        </Td>
                      )}
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </>
        )}
      </Flex>
      <AddNotificationModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onUpdated={reload}
        template={!editingNotification ? addTemplate : null}
        nid={editingNotification ?? null}
      />
    </>
  );
};

const CreateQueryNotificationMenuItem = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  return (
    <>
      <MenuItem onClick={onOpen}>Query</MenuItem>
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              How to create a new notification from search query
            </AlertDialogHeader>
            <AlertDialogBody>
              <OrderedList>
                <ListItem>Perform a new search</ListItem>
                <ListItem>On the results page, click the 'Create Email Notification' icon</ListItem>
              </OrderedList>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} ml={3}>
                Ok
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

const Action = ({
  notification,
  onSetActive,
  onEdit,
  onDelete,
}: {
  notification: INotification;
  onSetActive: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const colors = useColorModeColors();

  const toast = useToast({ duration: 2000 });

  const router = useRouter();

  const { id, type, template, data, active } = notification;

  const [runQueryId, setRunQueryId] = useState<number>(null);

  const { data: queries, error } = useGetNotificationQuery({ id }, { enabled: runQueryId !== null });

  // start fetching the queries
  const handleRunQuery = (qid: number) => {
    // this will start fetching queries for this notification
    setRunQueryId(qid);
  };

  useEffect(() => {
    if (runQueryId !== null && queries && queries[runQueryId] !== undefined) {
      // replace bibcode in sort
      const params = makeSearchParams(queries[runQueryId]).replaceAll('bibcode+', 'date+');

      // redirect to search page
      void router.push({ pathname: '/search', search: params });
      setRunQueryId(null);
    } else if (error) {
      toast({ status: 'error', title: 'An error occurred', description: parseAPIError(error) });
    }
  }, [queries, error, runQueryId]);

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="outline"
        rightIcon={<ChevronDownIcon />}
        onClick={(e) => e.stopPropagation()}
        children={<SettingsIcon />}
      />
      {/* make sure parent <tr> doesn't overwrite colors here when row is disabled */}
      <MenuList backgroundColor={colors.background} color={colors.text}>
        {type === 'template' && template === 'keyword' && data !== null ? (
          <>
            <MenuItem onClick={() => handleRunQuery(0)}>Recent Papers</MenuItem>
            <MenuItem onClick={() => handleRunQuery(1)}>Most Popular</MenuItem>
            <MenuItem onClick={() => handleRunQuery(2)}>Most Cited</MenuItem>
          </>
        ) : type === 'template' && template === 'arxiv' && !!data ? (
          <>
            <MenuItem onClick={() => handleRunQuery(0)}>Keyword Matches - Recent Papers</MenuItem>
            <MenuItem onClick={() => handleRunQuery(1)}>Other Recent Papers in Selected Categories</MenuItem>
          </>
        ) : (
          <MenuItem onClick={() => handleRunQuery(0)}>Search</MenuItem>
        )}
        <MenuDivider />
        <MenuItem onClick={() => onSetActive(!active)}>
          <Flex w="full" justifyContent="space-between" style={{ pointerEvents: 'none' }}>
            <Text>Enable Notification?</Text>
            <Switch isChecked={active} isFocusable={false} isReadOnly aria-hidden />
          </Flex>
        </MenuItem>
        {type !== 'query' && <MenuItem onClick={onEdit}>Edit</MenuItem>}
        <DeleteNotificationMenuItem onDelete={onDelete} />
      </MenuList>
    </Menu>
  );
};
