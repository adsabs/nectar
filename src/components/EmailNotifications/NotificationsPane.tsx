import {
  INotification,
  NotificationTemplate,
  NotificationType,
  useDelNotification,
  useEditNotification,
  useGetNotifications,
} from '@api';
import { ChevronDownIcon, SettingsIcon } from '@chakra-ui/icons';
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
} from '@chakra-ui/react';
import { CustomInfoMessage } from '@components/Feedbacks';
import { TableSkeleton } from '@components/Libraries/TableSkeleton';
import { TimeSince } from '@components/TimeSince';
import { useColorModeColors } from '@lib';
import { parseAPIError } from '@utils';
import { useEffect, useRef, useState } from 'react';
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

  // reset add/edit modal when modal closes
  useEffect(() => {
    if (!isCreateOpen) {
      setEditingNotification(null);
    }
  }, [isCreateOpen]);

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

  const reload = () => {
    remove();
    void refetch();
  };

  return (
    <>
      <Flex direction="column" gap={4}>
        <Flex direction={{ base: 'column', md: 'row' }} justifyContent={{ base: 'start', md: 'space-between' }} gap={2}>
          <Stack w="300px">
            <Input placeholder="search" />
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
        {/* TODO: error */}
        {!isLoading && (
          <>
            {!notifications || notifications.length === 0 ? (
              <CustomInfoMessage
                status="info"
                title="No Email Notifications"
                description="Click create to start adding email notifications"
              />
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
                  {notifications.map((n, i) => (
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
                            type={n.type}
                            template={n.template}
                            active={n.active}
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
  type,
  template,
  active,
  onSetActive,
  onEdit,
  onDelete,
}: {
  type: NotificationType;
  template: NotificationTemplate;
  active: boolean;
  onSetActive: (active: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const colors = useColorModeColors();

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
        {type === 'template' && template === 'keyword' ? (
          <MenuItem>Search</MenuItem>
        ) : (
          <>
            <MenuItem>Recent Papers</MenuItem>
            <MenuItem>Most Popular</MenuItem>
            <MenuItem>Most Cited</MenuItem>
          </>
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
