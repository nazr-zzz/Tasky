import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const KEY = 'tasky_device_id';

export async function getDeviceId() {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    await AsyncStorage.setItem(KEY, id);
  }
  return id;
}

export async function claimSession(uid, force = false) {
  const deviceId = await getDeviceId();
  const ref = doc(db, 'users', uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const d = snap.exists() ? snap.data() : {};
    const busy = !!d.activeDeviceId && d.activeDeviceId !== deviceId;
    if (busy && !force) throw new Error('DEVICE_BUSY');
    tx.set(ref, { activeDeviceId: deviceId, lastActive: serverTimestamp() }, { merge: true });
  });
}