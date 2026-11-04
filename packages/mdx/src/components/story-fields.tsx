'use client';

import { useDataEngine, useFieldValue } from '@fumari/stf';
import {
  typeToString,
  validate,
  type TypeNode,
} from '@fumadocs/story/type-tree';
import { directiveMeta } from '../lib/story-remark';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@terrafirmagreg-team/ui/components/ui/select';
import { cn } from '@terrafirmagreg-team/ui/lib/utils/cn';
import { X } from 'lucide-react';
import { useState } from 'react';

function resolveNode(node: TypeNode, value: unknown): TypeNode {
  if (node.type === 'intersection') return resolveNode(node.intersection, value);
  if (node.type !== 'union') return node;
  return resolveNode(
    node.types.find((item) => validate(item, value)) ?? node.types[0],
    value,
  );
}

function selectMembers(
  node: TypeNode,
): { label: string; value: unknown }[] | undefined {
  if (node.type === 'enum') return node.members;
  if (
    node.type === 'union' &&
    node.types.every((t) => t.type === 'literal')
  ) {
    return node.types.map((t) => ({
      label: String(t.type === 'literal' ? t.value : ''),
      value: t.type === 'literal' ? t.value : undefined,
    }));
  }
  return undefined;
}

const inputClass =
  'min-w-0 flex-1 bg-transparent px-3 text-fd-foreground outline-none placeholder:text-fd-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-fd-primary';

function StringEditor({
  name,
  value,
  setValue,
  multiline,
}: {
  name: string;
  value: unknown;
  setValue: (v: unknown) => void;
  multiline?: boolean;
}) {
  if (multiline) {
    const lineCount =
      typeof value === 'string' ? value.split('\n').length : 0;
    return (
      <textarea
        aria-label={name}
        rows={Math.min(12, Math.max(4, lineCount + 1))}
        value={value == null ? '' : String(value)}
        placeholder="string"
        onChange={(e) => setValue(e.target.value)}
        className={cn(inputClass, 'min-h-12 resize-y py-2 font-mono text-xs')}
      />
    );
  }
  return (
    <input
      aria-label={name}
      value={value == null ? '' : String(value)}
      placeholder="string"
      onChange={(e) => setValue(e.target.value)}
      className={inputClass}
    />
  );
}

function NumberEditor({
  name,
  value,
  setValue,
}: {
  name: string;
  value: unknown;
  setValue: (v: unknown) => void;
}) {
  return (
    <input
      aria-label={name}
      type="number"
      value={value == null ? '' : String(value)}
      placeholder="number"
      onChange={(e) =>
        setValue(e.target.value === '' ? undefined : Number(e.target.value))
      }
      className={inputClass}
    />
  );
}

function BooleanEditor({
  name,
  value,
  setValue,
}: {
  name: string;
  value: unknown;
  setValue: (v: unknown) => void;
}) {
  return (
    <input
      aria-label={name}
      type="checkbox"
      checked={value === true}
      onChange={(e) => setValue(e.target.checked)}
      className="mx-3 size-3.5 shrink-0 accent-fd-primary"
    />
  );
}

function SelectEditor({
  name,
  value,
  setValue,
  members,
}: {
  name: string;
  value: unknown;
  setValue: (v: unknown) => void;
  members: { label: string; value: unknown }[];
}) {
  const index = members.findIndex((m) => Object.is(m.value, value));
  return (
    <Select
      value={index < 0 ? '' : String(index)}
      onValueChange={(v) => {
        const next = members[Number(v)];
        if (next) setValue(next.value);
      }}
    >
      <SelectTrigger
        aria-label={name}
        className="h-8 flex-1 gap-1 border-0 bg-transparent px-3 text-xs shadow-none focus:ring-0 focus-visible:ring-1"
      >
        <SelectValue placeholder="select">
          {(v: unknown) =>
            typeof v === 'string' && v !== ''
              ? members[Number(v)]?.label
              : null
          }
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {members.map((m, i) => (
          <SelectItem key={i} value={String(i)} className="text-xs">
            {m.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function JsonEditor({
  name,
  value,
  setValue,
}: {
  name: string;
  value: unknown;
  setValue: (v: unknown) => void;
}) {
  const [text, setText] = useState(() =>
    value === undefined ? '' : JSON.stringify(value),
  );
  const [invalid, setInvalid] = useState(false);
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value) {
    setPrevValue(value);
    setText(value === undefined ? '' : JSON.stringify(value));
    setInvalid(false);
  }
  return (
    <textarea
      aria-label={name}
      rows={2}
      value={text}
      placeholder="JSON"
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        if (next.trim() === '') {
          setValue(undefined);
          setInvalid(false);
          return;
        }
        try {
          setValue(JSON.parse(next));
          setInvalid(false);
        } catch {
          setInvalid(true);
        }
      }}
      className={cn(
        inputClass,
        'min-h-10 resize-y py-2 font-mono text-xs',
        invalid && 'text-fd-error',
      )}
    />
  );
}

function Field({
  name,
  node,
  required,
  multiline,
  description,
}: {
  name: string;
  node: TypeNode;
  required?: boolean;
  multiline?: boolean;
  description?: string;
}) {
  const engine = useDataEngine();
  const [value, setValue] = useFieldValue([name]);
  const resolved = resolveNode(node, value);
  const members = selectMembers(resolved);

  let editor: React.ReactNode;
  if (members) {
    editor = (
      <SelectEditor
        name={name}
        value={value}
        setValue={setValue}
        members={members}
      />
    );
  } else if (resolved.type === 'boolean') {
    editor = <BooleanEditor name={name} value={value} setValue={setValue} />;
  } else if (resolved.type === 'number' || resolved.type === 'bigint') {
    editor = <NumberEditor name={name} value={value} setValue={setValue} />;
  } else if (resolved.type === 'string' || resolved.type === 'literal') {
    editor = (
      <StringEditor
        name={name}
        value={value}
        setValue={setValue}
        multiline={multiline}
      />
    );
  } else {
    editor = <JsonEditor name={name} value={value} setValue={setValue} />;
  }

  return (
    <div className="flex min-h-10 items-center border-b last:border-0">
      <span
        className="flex w-28 shrink-0 items-center gap-1 px-3 font-mono text-[0.8125rem] text-fd-muted-foreground"
        title={description}
      >
        <span className="truncate">{name}</span>
        {!required && <span className="text-fd-muted-foreground/60">?</span>}
      </span>
      {editor}
      <span className="hidden w-24 shrink-0 truncate px-2 font-mono text-xs text-fd-muted-foreground/70 @3xl:block">
        {typeToString(resolved)}
      </span>
      {!required && (
        <button
          type="button"
          aria-label={`Unset ${name}`}
          onClick={() => engine.delete([name])}
          className="me-2 flex size-6 shrink-0 items-center justify-center rounded-md text-fd-muted-foreground hover:bg-fd-accent hover:text-fd-foreground"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}

export function StoryFields({
  node,
  storyKey,
}: {
  node: TypeNode;
  storyKey: string;
}) {
  const meta = directiveMeta(storyKey);
  if (node.type !== 'object') return null;
  const multiline = new Set(meta?.multiline ?? []);
  const descriptions = meta?.descriptions ?? {};
  return (
    <div className="text-[0.8125rem]">
      {node.properties.map((prop) => (
        <Field
          key={prop.name}
          name={prop.name}
          node={prop.type}
          required={prop.required}
          multiline={multiline.has(prop.name)}
          description={descriptions[prop.name]}
        />
      ))}
    </div>
  );
}

