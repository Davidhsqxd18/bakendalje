const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} = require('firebase/firestore');
const { getAuth } = require('firebase/auth');

// Tu configuración de Firebase proporcionada
const firebaseConfig = {
  apiKey: "AIzaSyBOdK6vynO5V3flKKKBmvXln_y9GmDKdSc",
  authDomain: "aljedrez-8962d.firebaseapp.com",
  projectId: "aljedrez-8962d",
  storageBucket: "aljedrez-8962d.firebasestorage.app",
  messagingSenderId: "554584302085",
  appId: "1:554584302085:web:5a3aa004f18758d2fc726c",
  measurementId: "G-XCVW9NKMES"
};

// Inicializar Firebase Client SDK
const app = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(app);
const auth = getAuth(app);

console.log('Firebase Client SDK e inicialización de Auth completados con éxito. Conectado a aljedrez-8962d.');

// Creación del Query Builder para emular la API de Firestore Admin con el SDK modular de Firebase
const createQueryBuilder = (colName, constraints = []) => {
  return {
    where(field, op, value) {
      return createQueryBuilder(colName, [...constraints, { type: 'where', field, op, value, constraint: where(field, op, value) }]);
    },
    orderBy(field, dir = 'asc') {
      return createQueryBuilder(colName, [...constraints, { type: 'orderBy', field, dir, constraint: orderBy(field, dir) }]);
    },
    limit(n) {
      return createQueryBuilder(colName, [...constraints, { type: 'limit', value: n, constraint: limit(n) }]);
    },
    async get() {
      const rawConstraints = constraints.map(c => c.constraint);
      const q = query(collection(firestoreDb, colName), ...rawConstraints);
      const snap = await getDocs(q);
      return {
        empty: snap.empty,
        docs: snap.docs.map(docSnap => ({
          id: docSnap.id,
          exists: true,
          data: () => docSnap.data()
        }))
      };
    }
  };
};

const db = {
  collection(colName) {
    return {
      doc(docId) {
        const id = docId || Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const docRef = doc(firestoreDb, colName, id);

        return {
          id,
          async get() {
            const docSnap = await getDoc(docRef);
            const exists = docSnap.exists();
            return {
              id,
              exists,
              data: () => exists ? docSnap.data() : undefined
            };
          },
          async set(data, options = {}) {
            await setDoc(docRef, data, { merge: !!options.merge });
            return { id };
          },
          async update(data) {
            await updateDoc(docRef, data);
            return { id };
          },
          async delete() {
            await deleteDoc(docRef);
            return { id };
          }
        };
      },
      async add(data) {
        const docRef = await addDoc(collection(firestoreDb, colName), data);
        return { id: docRef.id };
      },
      where(field, op, value) {
        return createQueryBuilder(colName).where(field, op, value);
      },
      orderBy(field, dir = 'asc') {
        return createQueryBuilder(colName).orderBy(field, dir);
      },
      limit(n) {
        return createQueryBuilder(colName).limit(n);
      },
      async get() {
        return createQueryBuilder(colName).get();
      }
    };
  }
};

module.exports = { db, auth };
