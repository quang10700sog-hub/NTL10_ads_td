"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type ChangeEvent = "INSERT" | "UPDATE" | "DELETE";

interface UseRealtimeOptions {
  table: string;
  schema?: string;
  filter?: string;
  event?: ChangeEvent | "*";
  onInsert?: (payload: Record<string, unknown>) => void;
  onUpdate?: (payload: Record<string, unknown>) => void;
  onDelete?: (payload: Record<string, unknown>) => void;
  onChange?: () => void;
  enabled?: boolean;
}

export function useRealtime({
  table,
  schema = "public",
  filter,
  event = "*",
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    const channelConfig: Record<string, string> = {
      event,
      schema,
      table,
    };
    if (filter) channelConfig.filter = filter;

    const channel = supabase
      .channel(`realtime-${table}-${Date.now()}`)
      .on(
        "postgres_changes" as never,
        channelConfig,
        (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload.new);
              break;
            case "UPDATE":
              onUpdate?.(payload.new);
              break;
            case "DELETE":
              onDelete?.(payload.old);
              break;
          }
          onChange?.();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, schema, filter, event, enabled, onInsert, onUpdate, onDelete, onChange]);

  return channelRef;
}
