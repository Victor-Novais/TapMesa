import type { Metadata } from "next";
import { RestaurantsManager } from "@/features/admin";

export const metadata: Metadata = {
  title: "Restaurantes",
  description: "Gestão global de restaurantes no Aproxime Aí Admin",
};

export default function AdminRestaurantsPage() {
  return <RestaurantsManager />;
}
