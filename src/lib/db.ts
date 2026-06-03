import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './auth';
import { Invoice, AppUser, Client, AuditLog } from '../types';

const COLLECTIONS = {
  INVOICES: 'invoices',
  CLIENTS: 'clients',
  AUDIT_LOGS: 'audit_logs',
};

export const subscribeToAuditLogs = (callback: (logs: AuditLog[]) => void) => {
  const path = COLLECTIONS.AUDIT_LOGS;
  const q = query(collection(db, path), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => doc.data() as AuditLog);
    callback(logs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const createAuditLog = async (actor: AppUser, action: string, details?: string, targetId?: string) => {
  const id = `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  const log: AuditLog = {
    id,
    timestamp: new Date().toISOString(),
    actorId: actor.uid,
    actorName: actor.displayName || actor.email || 'Unknown',
    action,
    targetId,
    details
  };
  try {
    await setDoc(doc(db, COLLECTIONS.AUDIT_LOGS, id), log);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};

export const updateUserAccountStatus = async (actor: AppUser, targetUid: string, isDisabled: boolean) => {
  const path = `users/${targetUid}`;
  try {
    await updateDoc(doc(db, 'users', targetUid), { isDisabled });
    await createAuditLog(
      actor, 
      isDisabled ? 'ACCOUNT_DISABLED' : 'ACCOUNT_ENABLED', 
      `Account ${isDisabled ? 'disabled' : 'enabled'} for UID: ${targetUid}`,
      targetUid
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const updateUserRole = async (actor: AppUser, targetUid: string, role: string, isAuthorized: boolean) => {
  const path = `users/${targetUid}`;
  try {
    await updateDoc(doc(db, 'users', targetUid), { role, isAuthorized });
    await createAuditLog(
      actor, 
      'ROLE_UPDATED', 
      `Assigned role [${role}] and auth [${isAuthorized}] to UID: ${targetUid}`,
      targetUid
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const subscribeToClients = (callback: (clients: Client[]) => void) => {
  const path = COLLECTIONS.CLIENTS;
  const q = query(collection(db, path), orderBy('name', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const clients = snapshot.docs.map(doc => doc.data() as Client);
    callback(clients);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveClientToDb = async (client: Client) => {
  const path = `${COLLECTIONS.CLIENTS}/${client.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.CLIENTS, client.id), client);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateClientInDb = async (id: string, updates: Partial<Client>) => {
  const path = `${COLLECTIONS.CLIENTS}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.CLIENTS, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteClientFromDb = async (id: string) => {
  const path = `${COLLECTIONS.CLIENTS}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.CLIENTS, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToInvoices = (callback: (invoices: Invoice[]) => void) => {
  const path = COLLECTIONS.INVOICES;
  const q = query(collection(db, path), orderBy('issueDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const invoices = snapshot.docs.map(doc => doc.data() as Invoice);
    callback(invoices);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveInvoiceToDb = async (invoice: Invoice) => {
  const path = `${COLLECTIONS.INVOICES}/${invoice.id}`;
  try {
    await setDoc(doc(db, COLLECTIONS.INVOICES, invoice.id), invoice);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateInvoiceInDb = async (id: string, updates: Partial<Invoice>) => {
  const path = `${COLLECTIONS.INVOICES}/${id}`;
  try {
    await updateDoc(doc(db, COLLECTIONS.INVOICES, id), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteInvoiceFromDb = async (id: string) => {
  const path = `${COLLECTIONS.INVOICES}/${id}`;
  try {
    await deleteDoc(doc(db, COLLECTIONS.INVOICES, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const purgeInvoicesFromDb = async () => {
  const path = COLLECTIONS.INVOICES;
  try {
    const querySnapshot = await getDocs(collection(db, path));
    const deletePromises = querySnapshot.docs.map(document => deleteDoc(doc(db, COLLECTIONS.INVOICES, document.id)));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const getInvoicesFromDb = async (): Promise<Invoice[]> => {
  const path = COLLECTIONS.INVOICES;
  try {
    const q = query(collection(db, path), orderBy('issueDate', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Invoice);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const subscribeToUsers = (callback: (users: AppUser[]) => void) => {
  const path = 'users';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as AppUser);
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
