import { IconCopy, IconDatabase, IconEdit, IconTrash, IconRefresh } from '@tabler/icons';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import CopyEnvironment from '../../CopyEnvironment';
import DeleteEnvironment from '../../DeleteEnvironment';
import RenameEnvironment from '../../RenameEnvironment';
import EnvironmentVariables from './EnvironmentVariables';
import { isCollectionSubscriber, getMasterCollectionUid } from 'utils/environment-sync';
import { findCollectionByUid } from 'utils/collections';

const EnvironmentDetails = ({ environment, collection, setIsModified, onClose }) => {
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openCopyModal, setOpenCopyModal] = useState(false);

  // Check if this collection is a subscriber
  const syncRelationships = useSelector((state) => state.app.environmentSync.syncRelationships);
  const collections = useSelector((state) => state.collections.collections);
  const isSubscriber = isCollectionSubscriber(syncRelationships, collection.uid);
  const masterCollectionUid = getMasterCollectionUid(syncRelationships, collection.uid);
  const masterCollection = masterCollectionUid ? findCollectionByUid(collections, masterCollectionUid) : null;

  return (
    <div className="px-6 flex-grow flex flex-col pt-6" style={{ maxWidth: '700px' }}>
      {openEditModal && (
        <RenameEnvironment onClose={() => setOpenEditModal(false)} environment={environment} collection={collection} />
      )}
      {openDeleteModal && (
        <DeleteEnvironment
          onClose={() => setOpenDeleteModal(false)}
          environment={environment}
          collection={collection}
        />
      )}
      {openCopyModal && (
        <CopyEnvironment onClose={() => setOpenCopyModal(false)} environment={environment} collection={collection} />
      )}

      {/* Sync indicator banner */}
      {isSubscriber && masterCollection && (
        <div className="mb-4 p-3 rounded bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800">
          <div className="flex items-center text-sm">
            <IconRefresh size={16} className="text-teal-600 dark:text-teal-400 mr-2" strokeWidth={2} />
            <span className="text-teal-700 dark:text-teal-300">
              <strong>Synced from {masterCollection.name}</strong>
            </span>
          </div>
          <div className="mt-1 text-xs text-teal-600 dark:text-teal-400 ml-6">
            Changes will update the master collection and sync to all subscribers
          </div>
        </div>
      )}

      <div className="flex">
        <div className="flex flex-grow items-center">
          <IconDatabase className="cursor-pointer" size={20} strokeWidth={1.5} />
          <span className="ml-1 font-semibold break-all">{environment.name}</span>
        </div>
        <div className="flex gap-x-4 pl-4">
          <IconEdit className="cursor-pointer" size={20} strokeWidth={1.5} onClick={() => setOpenEditModal(true)} />
          <IconCopy className="cursor-pointer" size={20} strokeWidth={1.5} onClick={() => setOpenCopyModal(true)} />
          <IconTrash className="cursor-pointer" size={20} strokeWidth={1.5} onClick={() => setOpenDeleteModal(true)} />
        </div>
      </div>

      <div>
        <EnvironmentVariables environment={environment} collection={collection} setIsModified={setIsModified} onClose={onClose} />
      </div>
    </div>
  );
};

export default EnvironmentDetails;
