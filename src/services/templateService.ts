import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { TemplateSettings } from "../types";

// Salvar template (pode ser por usuário futuramente)
export async function saveTemplate(settings: TemplateSettings) {
  await setDoc(doc(db, "templates", "default"), settings);
}

// Buscar template
export async function getTemplate(): Promise<TemplateSettings | null> {
  const docSnap = await getDoc(doc(db, "templates", "default"));
  return docSnap.exists() ? (docSnap.data() as TemplateSettings) : null;
} 