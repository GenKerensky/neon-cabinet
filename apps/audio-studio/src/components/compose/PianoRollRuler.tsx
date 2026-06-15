export function PianoRollRuler() {
  return (
    <div className="beat-ruler">
      {Array.from({ length: 8 }, (_, index) => (
        <span key={index}>
          Bar {Math.floor(index / 4) + 1}.{(index % 4) + 1}
        </span>
      ))}
    </div>
  );
}
