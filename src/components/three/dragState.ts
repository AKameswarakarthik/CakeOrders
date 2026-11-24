/** Mutable drag state shared between decoration meshes and the DragController (no re-renders). */
export const dragState: { uid: string | null; moved: boolean } = { uid: null, moved: false };
