/**
 * Shared Types for SectionEditor Forms
 * Requirements: 3.4
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DataRecord = Record<string, any>;
export type UpdateFieldFn = (path: string, value: unknown) => void;
export type AddArrayItemFn = (path: string, item: unknown) => void;
export type RemoveArrayItemFn = (path: string, index: number) => void;
export type OnImagePickFn = (field: string) => void;

export interface FormProps {
  data: DataRecord;
  updateField: UpdateFieldFn;
  addArrayItem?: AddArrayItemFn;
  removeArrayItem?: RemoveArrayItemFn;
  onImagePick?: OnImagePickFn;
}
