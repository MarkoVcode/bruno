import React from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconFiles } from '@tabler/icons';
import { removeCollection } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid } from 'utils/collections/index';

const RemoveCollection = ({ onClose, collectionUid }) => {
  const dispatch = useDispatch();
  const collection = useSelector(state => findCollectionByUid(state.collections.collections, collectionUid));

  const onConfirm = () => {
    dispatch(removeCollection(collection.uid))
      .then(() => {
        toast.success('Collection detached');
        onClose();
      })
      .catch(() => toast.error('An error occurred while detaching the collection'));
  };

  return (
    <Modal size="sm" title="Detach Collection" confirmText="Detach" handleConfirm={onConfirm} handleCancel={onClose}>
      <div className="flex items-center">
        <IconFiles size={18} strokeWidth={1.5} />
        <span className="ml-2 mr-4 font-semibold">{collection.name}</span>
      </div>
      <div className="break-words text-xs mt-1">{collection.pathname}</div>
      <div className="mt-4">
        Are you sure you want to detach collection <span className="font-semibold">{collection.name}</span> from BrunoN?
      </div>
      <div className="mt-4">
        It will still be available in the file system at the above location and can be re-opened later.
      </div>
    </Modal>
  );
};

export default RemoveCollection;
