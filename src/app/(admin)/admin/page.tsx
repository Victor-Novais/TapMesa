import type { Metadata } from "next";
import { RestaurantsManager } from "@/features/admin";

export const metadata: Metadata = {
  title: "Restaurantes",
  description: "Gestão global de restaurantes no TapMesa Admin",
};

export default function AdminRestaurantsPage() {
  return <RestaurantsManager />;
}
