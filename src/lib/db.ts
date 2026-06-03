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
import { Invoice, AppUser } from '../types';

const COLLECTIONS = {
  INVOICES: 'invoices',
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

export const updateUserAuthorization = async (uid: string, isAuthorized: boolean) => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), { isAuthorized });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};
