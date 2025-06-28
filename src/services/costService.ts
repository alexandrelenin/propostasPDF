import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { Cost } from "../types";

// Salvar ou atualizar custo
export async function saveCost(cost: Cost) {
  await setDoc(doc(db, "costs", cost.id), cost);
}

// Buscar todos os custos
export async function getAllCosts(): Promise<Cost[]> {
  const querySnapshot = await getDocs(collection(db, "costs"));
  return querySnapshot.docs.map(doc => doc.data() as Cost);
}

// Buscar custo por ID
export async function getCostById(id: string): Promise<Cost | null> {
  const docSnap = await getDoc(doc(db, "costs", id));
  return docSnap.exists() ? (docSnap.data() as Cost) : null;
}

// Deletar custo
export async function deleteCost(id: string) {
  await deleteDoc(doc(db, "costs", id));
} 