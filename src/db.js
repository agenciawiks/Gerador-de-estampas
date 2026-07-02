import localforage from 'localforage';
import { db, isFirebaseConfigured } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc 
} from 'firebase/firestore';

export const appDb = {
  // Helper para fazer upload de arquivos via nossa API
  async _uploadFile(id, nome, file) {
    try {
      const cleanName = nome.replace(/[^a-zA-Z0-9.-]/g, '_');
      const response = await fetch(`/api/upload?filename=${id}_${cleanName}`, {
        method: 'POST',
        body: file,
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar arquivo para o servidor');
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error("Erro no upload do arquivo:", error);
      throw error;
    }
  },

  // Helper para deletar arquivos via nossa API
  async _deleteFile(url) {
    try {
      await fetch(`/api/delete?url=${encodeURIComponent(url)}`, {
        method: 'POST'
      });
    } catch (error) {
      console.warn("Erro ao deletar arquivo físico:", error);
    }
  },

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
        return fundos.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      } catch (error) {
        console.error("Erro ao carregar fundos do Firebase:", error);
      }
    }
    return (await localforage.getItem('db_fundos')) || [];
  },

  async saveFundo(id, nome, file) {
    // 1. Faz o upload do arquivo físico (seja local ou Vercel Blob)
    const fileUrl = await this._uploadFile(id, nome, file);

    if (isFirebaseConfigured) {
      try {
        // 2. Salva os metadados no Firestore
        const fundoData = {
          nome,
          dataUrl: fileUrl, // Usamos dataUrl para manter compatibilidade com o frontend
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'fundos', id), fundoData);
        return { id, ...fundoData };
      } catch (error) {
        console.error("Erro ao salvar metadados do fundo no Firebase:", error);
        throw error;
      }
    }

    // Fallback LocalForage
    const newFundo = { id, nome, dataUrl: fileUrl };
    const list = (await localforage.getItem('db_fundos')) || [];
    list.push(newFundo);
    await localforage.setItem('db_fundos', list);
    return newFundo;
  },

  async deleteFundo(id) {
    let fileUrl = null;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'fundos', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fileUrl = docSnap.data().dataUrl;
        }
        // Deleta do Firestore
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Erro ao deletar fundo do Firebase:", error);
      }
    } else {
      const list = (await localforage.getItem('db_fundos')) || [];
      const item = list.find(f => f.id === id);
      if (item) fileUrl = item.dataUrl;
      const newList = list.filter(f => f.id !== id);
      await localforage.setItem('db_fundos', newList);
    }

    // Exclui o arquivo físico (local ou Vercel Blob)
    if (fileUrl) {
      await this._deleteFile(fileUrl);
    }
  },

  async clearFundos(ids = []) {
    for (const id of ids) {
      await this.deleteFundo(id);
    }
    if (!isFirebaseConfigured) {
      await localforage.setItem('db_fundos', []);
    }
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
    // 1. Faz o upload do arquivo físico (seja local ou Vercel Blob)
    const fileUrl = await this._uploadFile(id, nome, file);

    if (isFirebaseConfigured) {
      try {
        // 2. Salva os metadados no Firestore
        const estampaData = {
          nome,
          dataUrl: fileUrl,
          createdAt: Date.now()
        };
        await setDoc(doc(db, 'estampas', id), estampaData);
        return { id, ...estampaData };
      } catch (error) {
        console.error("Erro ao salvar metadados da estampa no Firebase:", error);
        throw error;
      }
    }

    // Fallback LocalForage
    const newEstampa = { id, nome, dataUrl: fileUrl };
    const list = (await localforage.getItem('db_estampas')) || [];
    list.push(newEstampa);
    await localforage.setItem('db_estampas', list);
    return newEstampa;
  },

  async deleteEstampa(id) {
    let fileUrl = null;

    if (isFirebaseConfigured) {
      try {
        const docRef = doc(db, 'estampas', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          fileUrl = docSnap.data().dataUrl;
        }
        // Deleta do Firestore
        await deleteDoc(docRef);
      } catch (error) {
        console.error("Erro ao deletar estampa do Firebase:", error);
      }
    } else {
      const list = (await localforage.getItem('db_estampas')) || [];
      const item = list.find(e => e.id !== id);
      if (item) fileUrl = item.dataUrl;
      const newList = list.filter(e => e.id !== id);
      await localforage.setItem('db_estampas', newList);
    }

    // Exclui o arquivo físico (local ou Vercel Blob)
    if (fileUrl) {
      await this._deleteFile(fileUrl);
    }
  },

  async clearEstampas(ids = []) {
    for (const id of ids) {
      await this.deleteEstampa(id);
    }
    if (!isFirebaseConfigured) {
      await localforage.setItem('db_estampas', []);
    }
  }
};
