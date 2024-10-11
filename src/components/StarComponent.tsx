import StarEntity from "@/entities/StarEntity";

export default function StarComponent({ star }: Readonly<{ star: StarEntity }>) {
  return (
    <div className="relative h-[10%]">
        <h2 className="absolute top-0 left-0 right-0 bg-black text-center z-10">
            Devinez le lieu de naissance de {star.name}
        </h2>
    </div>
);
  }
  