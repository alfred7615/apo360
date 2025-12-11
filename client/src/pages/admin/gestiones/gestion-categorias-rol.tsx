import CategoriasRolSection from "@/components/admin/categorias-rol-section";

export default function GestionCategoriasRolScreen() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestión de Categorías de Roles</h1>
        <p className="text-muted-foreground">
          Administra las categorías y subcategorías para cada tipo de rol (Policía, SAMU, Taxi, etc.)
        </p>
      </div>
      <CategoriasRolSection />
    </div>
  );
}
