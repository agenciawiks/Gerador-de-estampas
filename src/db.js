import localforage from 'localforage';
import { db, storage, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';

export const appDb = {
  // ── Theme Mode ─────────────────────────────────────────────────────────────
  async loadTheme() {
    if (isFirebaseConfigured) {
      try {
        const themeDoc = await getDoc(doc(db, 'settings', 'theme_mode'));
        if (themeDoc.exists()) {
          return themeDoc.data().isDarkMode;
        }
      } catch (error) {
        console.error("Erro ao carregar tema do Firebase:", error);
      }
    }
    return localforage.getItem('db_theme_mode');
  },

  async saveTheme(isDarkMode) {
    if (isFirebaseConfigured) {
      try {
        await setDoc(doc(db, 'settings', 'theme_mode'), { isDarkMode });
        return;
      } catch (error) {
        console.error("Erro ao salvar tema no Firebase:", error);
      }
    }
    await localforage.setItem('db_theme_mode', isDarkMode);
  },

  // ── Fundos (Mockups) ───────────────────────────────────────────────────────
  async loadFundos() {
    if (isFirebaseConfigured) {
      try {
        const querySnapshot = await getDocs(collection(db, 'fundos'));
        const fundos = [];
        querySnapshot.forEach((doc) => {
          fundos.push({ id: doc.id, ...doc.data() });
        });
        // Ordena por data de criação para manter a ordem consistente
        return fundos.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      } catch (error) {
        console.error("Erro ao carregar fundos do Firebase:", error);
      }
    }
    return (await localforage.getItem('db_fundos')) || [];
  },

  async saveFundo(id, nome, file) {
    if (isFirebaseConfigured) {
      try {
        // 1. Upload do arquivo para o Firebase Storage
        const storageRef = ref(storage, `fundos/${id}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        // 2. Salva os metadados no Firestore
        const fundoData = {
          nome,
          dataUrl: downloadUrl, // Usamos dataUrl para manter compatibilidade com o frontend
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'fundos', id), fundoData);
        return { id, ...fundoData };
      } catch (error) {
        console.error("Erro ao salvar fundo no Firebase:", error);
        throw error;
      }
    }

    // Fallback LocalForage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const newFundo = { id, nome, dataUrl: ev.target.result };
          const list = (await localforage.getItem('db_fundos')) || [];
          list.push(newFundo);
          await localforage.setItem('db_fundos', list);
          resolve(newFundo);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  async deleteFundo(id) {
    if (isFirebaseConfigured) {
      try {
        // 1. Deleta do Firestore
        await deleteDoc(doc(db, 'fundos', id));
        // 2. Deleta do Storage
        try {
          const storageRef = ref(storage, `fundos/${id}`);
          await deleteObject(storageRef);
        } catch (storageError) {
          // Se o arquivo não existir no storage, ignoramos
          console.warn("Arquivo não encontrado no Storage ao deletar:", storageError);
        }
        return;
      } catch (error) {
        console.error("Erro ao deletar fundo no Firebase:", error);
        throw error;
      }
    }

    // Fallback LocalForage
    const list = (await localforage.getItem('db_fundos')) || [];
    const newList = list.filter(f => f.id !== id);
    await localforage.setItem('db_fundos', newList);
  },

  async clearFundos(ids = []) {
    if (isFirebaseConfigured) {
      try {
        for (const id of ids) {
          await this.deleteFundo(id);
        }
        return;
      } catch (error) {
        console.error("Erro ao limpar fundos no Firebase:", error);
        throw error;
      }
    }
    await localforage.setItem('db_fundos', []);
  },

  // ── Estampas (Logos) ───────────────────────────────────────────────────────
  async loadEstampas() {
    if (isFirebaseConfigured) {
      try {
        const querySnapshot = await getDocs(collection(db, 'estampas'));
        const estampas = [];
        querySnapshot.forEach((doc) => {
          estampas.push({ id: doc.id, ...doc.data() });
        });
        return estampas.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      } catch (error) {
        console.error("Erro ao carregar estampas do Firebase:", error);
      }
    }
    return (await localforage.getItem('db_estampas')) || [];
  },

  async saveEstampa(id, nome, file) {
    if (isFirebaseConfigured) {
      try {
        // 1. Upload do arquivo para o Firebase Storage
        const storageRef = ref(storage, `estampas/${id}`);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadUrl = await getDownloadURL(snapshot.ref);

        // 2. Salva os metadados no Firestore
        const estampaData = {
          nome,
          dataUrl: downloadUrl,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'estampas', id), estampaData);
        return { id, ...estampaData };
      } catch (error) {
        console.error("Erro ao salvar estampa no Firebase:", error);
        throw error;
      }
    }

    // Fallback LocalForage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const newEstampa = { id, nome, dataUrl: ev.target.result };
          const list = (await localforage.getItem('db_estampas')) || [];
          list.push(newEstampa);
          await localforage.setItem('db_estampas', list);
          resolve(newEstampa);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  },

  async deleteEstampa(id) {
    if (isFirebaseConfigured) {
      try {
        // 1. Deleta do Firestore
        await deleteDoc(doc(db, 'estampas', id));
        // 2. Deleta do Storage
        try {
          const storageRef = ref(storage, `estampas/${id}`);
          await deleteObject(storageRef);
        } catch (storageError) {
          console.warn("Arquivo não encontrado no Storage ao deletar:", storageError);
        }
        return;
      } catch (error) {
        console.error("Erro ao deletar estampa no Firebase:", error);
        throw error;
      }
    }

    // Fallback LocalForage
    const list = (await localforage.getItem('db_estampas')) || [];
    const newList = list.filter(e => e.id !== id);
    await localforage.setItem('db_estampas', newList);
  },

  async clearEstampas(ids = []) {
    if (isFirebaseConfigured) {
      try {
        for (const id of ids) {
          await this.deleteEstampa(id);
        }
        return;
      } catch (error) {
        console.error("Erro ao limpar estampas no Firebase:", error);
        throw error;
      }
    }
    await localforage.setItem('db_estampas', []);
  }
};
