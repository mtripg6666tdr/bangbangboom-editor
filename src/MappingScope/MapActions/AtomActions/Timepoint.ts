import { EditMap, Timepoint, FreshTimepointCache, TimepointSignature } from "../../EditMap"
import { assert, shallowPatch } from "../../../Common/utils"
import { makeAction } from "./types"

const add = (map: EditMap, id: number, time: number, bpm: number, bpb: number) => {
  const newtp: Timepoint =
    { id, time, bpm, bpb, ticktimecache: 0 }
  const sig = TimepointSignature(newtp)
  if (map.timepointsignature.has(sig)) return

  map.timepoints.set(newtp.id, newtp)
  map.timepointsignature.set(sig, newtp)

  FreshTimepointCache(newtp)
  return newtp
}

const del = (map: EditMap, id: number) => {
  const tp = assert(map.timepoints.get(id))
  map.timepoints.delete(id)
  const sig = TimepointSignature(tp)
  map.timepointsignature.delete(sig)

  return tp
}

type PatchType = Partial<Pick<Timepoint, "time" | "bpm" | "bpb">>

const setv = (map: EditMap, id: number, patch: PatchType) => {
  const tp = assert(map.timepoints.get(id))
  const prevsig = TimepointSignature(tp)
  const changes = shallowPatch(tp, patch)
  if (changes) {
    const sig = TimepointSignature(tp)
    if (sig !== prevsig && map.timepointsignature.has(sig)) {
      shallowPatch(tp, changes)
      return
    }

    FreshTimepointCache(tp)
    return changes
  }
}

export const TimepointActions = {
  Add: makeAction((map: EditMap, id: number, time: number, bpm: number, bpb: number) => {
    const res = add(map, id, time, bpm, bpb)
    if (res)
      return (map: EditMap) => del(map, res.id)
  }),
  Remove: makeAction((map: EditMap, id: number) => {
    const res = del(map, id)
    if (res)
      return (map: EditMap) => add(map, res.id, res.time, res.bpm, res.bpb)
  }),
  Set: makeAction((map: EditMap, id: number, patch: PatchType) => {
    const res = setv(map, id, patch)
    if (res)
      return (map: EditMap) => setv(map, id, patch)
  })
}
