import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { processHookTopBar } from 'utils/hookTopBar';
import { setHookTopBarValue, setHookTopBarLoading, clearHookTopBarValue } from 'providers/ReduxStore/slices/hookTopBar';
import StyledWrapper from './StyledWrapper';

const HookTopBar = ({ collection }) => {
  const dispatch = useDispatch();
  const { displayValue, isLoading } = useSelector((state) => state.hookTopBar);

  // Get active environments
  const activeEnvironmentUid = collection?.activeEnvironmentUid;
  const activeGlobalEnvironmentUid = useSelector((state) => state.globalEnvironments.activeGlobalEnvironmentUid);
  const globalEnvironments = useSelector((state) => state.globalEnvironments.globalEnvironments);

  // Find active environments
  const activeCollectionEnv = collection?.environments?.find((env) => env.uid === activeEnvironmentUid);
  const activeGlobalEnv = globalEnvironments?.find((env) => env.uid === activeGlobalEnvironmentUid);

  useEffect(() => {
    // Check both collection and global environments for hookTopBar variable
    let hookTopBarValue = null;

    // Check collection environment first (takes precedence)
    if (activeCollectionEnv) {
      const collectionVar = activeCollectionEnv.variables?.find((v) => v.name === 'hookTopBar' && v.enabled);
      if (collectionVar) {
        hookTopBarValue = collectionVar.value;
      }
    }

    // Check global environment if not found in collection
    if (!hookTopBarValue && activeGlobalEnv) {
      const globalVar = activeGlobalEnv.variables?.find((v) => v.name === 'hookTopBar' && v.enabled);
      if (globalVar) {
        hookTopBarValue = globalVar.value;
      }
    }

    // Process hookTopBar if found
    if (hookTopBarValue) {
      dispatch(setHookTopBarLoading(true));
      processHookTopBar(hookTopBarValue)
        .then((resolvedValue) => {
          if (resolvedValue) {
            dispatch(setHookTopBarValue(resolvedValue));
          } else {
            dispatch(clearHookTopBarValue());
          }
        })
        .catch((error) => {
          console.error('Error processing hookTopBar:', error);
          dispatch(clearHookTopBarValue());
        });
    } else {
      // No hookTopBar variable found, clear display
      dispatch(clearHookTopBarValue());
    }
  }, [activeEnvironmentUid, activeGlobalEnvironmentUid, activeCollectionEnv, activeGlobalEnv, dispatch]);

  // Don't render anything if no value or loading
  if (!displayValue || isLoading) {
    return null;
  }

  return (
    <StyledWrapper>
      <div className="hook-topbar-display" title={displayValue}>
        {displayValue}
      </div>
    </StyledWrapper>
  );
};

export default HookTopBar;
