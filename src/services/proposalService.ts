import { db } from "./firebase";
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc } from "firebase/firestore";
import { Proposal } from "../types";

// Salvar ou atualizar proposta
export async function saveProposal(proposal: Proposal) {
  await setDoc(doc(db, "proposals", proposal.id), proposal);
}

// Buscar todas as propostas
export async function getAllProposals(): Promise<Proposal[]> {
  const querySnapshot = await getDocs(collection(db, "proposals"));
  return querySnapshot.docs.map(doc => doc.data() as Proposal);
}

// Buscar proposta por ID
export async function getProposalById(id: string): Promise<Proposal | null> {
  const docSnap = await getDoc(doc(db, "proposals", id));
  return docSnap.exists() ? (docSnap.data() as Proposal) : null;
}

// Deletar proposta
export async function deleteProposal(id: string) {
  await deleteDoc(doc(db, "proposals", id));
} 