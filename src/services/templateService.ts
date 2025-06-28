import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc, updateDoc, writeBatch, query, where } from "firebase/firestore";
import { Template } from "../types";

const templatesCollection = collection(db, "templates");

// Criar ou atualizar template
export async function saveTemplate(template: Template) {
  await setDoc(doc(templatesCollection, template.id), template);
}

// Buscar todos os templates
export async function getAllTemplates(): Promise<Template[]> {
  const querySnapshot = await getDocs(templatesCollection);
  return querySnapshot.docs.map(doc => doc.data() as Template);
}

// Buscar template por ID
export async function getTemplateById(id: string): Promise<Template | null> {
  const docSnap = await getDoc(doc(templatesCollection, id));
  return docSnap.exists() ? (docSnap.data() as Template) : null;
}

// Deletar template
export async function deleteTemplate(id: string) {
  await deleteDoc(doc(templatesCollection, id));
}

// Definir template padrão (isDefault)
export async function setDefaultTemplate(id: string) {
  // Buscar todos os templates
  const templates = await getAllTemplates();
  const batch = writeBatch(db);
  templates.forEach(t => {
    const ref = doc(templatesCollection, t.id);
    batch.update(ref, { isDefault: t.id === id });
  });
  await batch.commit();
}

// Buscar template padrão
export async function getDefaultTemplate(): Promise<Template | null> {
  const q = query(templatesCollection, where("isDefault", "==", true));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data() as Template;
  }
  return null;
} 