import React, { useEffect } from 'react';
import each from 'lodash/each';
import filter from 'lodash/filter';
import groupBy from 'lodash/groupBy';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import { findCollectionByUid, flattenItems, isItemARequest } from 'utils/collections';
import { pluralizeWord } from 'utils/common';
import { completeQuitFlow } from 'providers/ReduxStore/slices/app';
import { saveMultipleRequests } from 'providers/ReduxStore/slices/collections/actions';
import { IconAlertTriangle } from '@tabler/icons';
import Modal from 'components/Modal';

const SaveRequestsModal = ({ onClose }) => {
  const MAX_UNSAVED_REQUESTS_TO_SHOW = 5;
  const currentDrafts = [];
  const readOnlyDrafts = [];
  const collections = useSelector((state) => state.collections.collections);
  const tabs = useSelector((state) => state.tabs.tabs);
  const dispatch = useDispatch();

  const tabsByCollection = groupBy(tabs, (t) => t.collectionUid);
  Object.keys(tabsByCollection).forEach((collectionUid) => {
    const collection = findCollectionByUid(collections, collectionUid);
    if (collection) {
      const items = flattenItems(collection.items);
      const drafts = filter(items, (item) => isItemARequest(item) && item.draft);
      const isReadOnly = collection.brunoConfig?.readOnly;

      each(drafts, (draft) => {
        const draftItem = {
          ...draft,
          collectionUid: collectionUid
        };

        if (isReadOnly) {
          readOnlyDrafts.push(draftItem);
        } else {
          currentDrafts.push(draftItem);
        }
      });
    }
  });

  useEffect(() => {
    if (currentDrafts.length === 0 && readOnlyDrafts.length === 0) {
      return dispatch(completeQuitFlow());
    }
  }, [currentDrafts, readOnlyDrafts, dispatch]);

  const closeWithoutSave = () => {
    dispatch(completeQuitFlow());
    onClose();
  };

  const closeWithSave = () => {
    // Only save non-read-only drafts
    if (currentDrafts.length > 0) {
      dispatch(saveMultipleRequests(currentDrafts))
        .then(() => dispatch(completeQuitFlow()))
        .then(() => onClose())
        .catch((err) => {
          console.error('Error saving requests:', err);
          // Still close even if save fails
          dispatch(completeQuitFlow());
          onClose();
        });
    } else {
      // No saveable drafts, just close
      dispatch(completeQuitFlow());
      onClose();
    }
  };

  if (!currentDrafts.length && !readOnlyDrafts.length) {
    return null;
  }

  return (
    <Modal
      size="md"
      title="Unsaved changes"
      confirmText="Save and Close"
      cancelText="Close without saving"
      handleCancel={onClose}
      disableEscapeKey={true}
      disableCloseOnOutsideClick={true}
      closeModalFadeTimeout={150}
      hideFooter={true}
    >
      <div className="flex items-center">
        <IconAlertTriangle size={32} strokeWidth={1.5} className="text-yellow-600" />
        <h1 className="ml-2 text-lg font-semibold">Hold on..</h1>
      </div>

      {currentDrafts.length > 0 && (
        <>
          <p className="mt-4">
            Do you want to save the changes you made to the following{' '}
            <span className="font-medium">{currentDrafts.length}</span> {pluralizeWord('request', currentDrafts.length)}?
          </p>

          <ul className="mt-4">
            {currentDrafts.slice(0, MAX_UNSAVED_REQUESTS_TO_SHOW).map((item) => {
              return (
                <li key={item.uid} className="mt-1 text-xs">
                  {item.filename}
                </li>
              );
            })}
          </ul>

          {currentDrafts.length > MAX_UNSAVED_REQUESTS_TO_SHOW && (
            <p className="mt-1 text-xs">
              ...{currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW} additional{' '}
              {pluralizeWord('request', currentDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW)} not shown
            </p>
          )}
        </>
      )}

      {readOnlyDrafts.length > 0 && (
        <>
          <p className="mt-4 text-amber-600 text-sm">
            <strong>Note:</strong> Changes to the following {readOnlyDrafts.length}{' '}
            {pluralizeWord('request', readOnlyDrafts.length)} from read-only collections will not be saved:
          </p>

          <ul className="mt-2 opacity-70">
            {readOnlyDrafts.slice(0, MAX_UNSAVED_REQUESTS_TO_SHOW).map((item) => {
              return (
                <li key={item.uid} className="mt-1 text-xs">
                  {item.filename}
                </li>
              );
            })}
          </ul>

          {readOnlyDrafts.length > MAX_UNSAVED_REQUESTS_TO_SHOW && (
            <p className="mt-1 text-xs opacity-70">
              ...{readOnlyDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW} additional{' '}
              {pluralizeWord('request', readOnlyDrafts.length - MAX_UNSAVED_REQUESTS_TO_SHOW)} not shown
            </p>
          )}
        </>
      )}

      <div className="flex justify-between mt-6">
        <div>
          <button className="btn btn-sm btn-danger" onClick={closeWithoutSave}>
            Don't Save
          </button>
        </div>
        <div>
          <button className="btn btn-close btn-sm mr-2" onClick={onClose}>
            Cancel
          </button>
          {currentDrafts.length > 0 ? (
            <button className="btn btn-secondary btn-sm" onClick={closeWithSave}>
              {currentDrafts.length > 1 ? 'Save All' : 'Save'}
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={closeWithSave}>
              Close
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SaveRequestsModal;
