import { startTransition, useEffect, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import {
  CLONE_SURVEY_ID,
  CLONE_SURVEY_VERSION,
  buildCloneBlueprintDoc,
  mergeCloneAnswers,
} from '../lib/cloneBlueprint'

export function useCloneBlueprint(user) {
  const [intake, setIntake] = useState(null)
  const [loadedUserId, setLoadedUserId] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user || !db) return undefined

    return onSnapshot(
      doc(db, 'users', user.uid, 'intakes', 'main'),
      (snapshot) => {
        startTransition(() => {
          setIntake(
            snapshot.exists()
              ? {
                  id: snapshot.id,
                  ...snapshot.data(),
                }
              : null,
          )
          setLoadedUserId(user.uid)
          setError(null)
        })
      },
      (snapshotError) => {
        startTransition(() => {
          setLoadedUserId(user.uid)
          setError(snapshotError)
        })
      },
    )
  }, [user])

  const loading = Boolean(user) && loadedUserId !== user.uid

  async function saveDraft(answers) {
    if (!user || !db) return

    const blueprint = buildCloneBlueprintDoc(answers)
    await setDoc(
      doc(db, 'users', user.uid, 'intakes', 'main'),
      {
        surveyId: CLONE_SURVEY_ID,
        surveyVersion: CLONE_SURVEY_VERSION,
        status: 'draft',
        answers: mergeCloneAnswers(answers),
        summary: blueprint.summary,
        cloneMeta: blueprint.cloneMeta,
        schemaVersion: blueprint.schemaVersion,
        template: blueprint.template,
        client: blueprint.client,
        brand: blueprint.brand,
        experience: blueprint.experience,
        navigation: blueprint.navigation,
        coach: blueprint.coach,
        tracking: blueprint.tracking,
        nutrition: blueprint.nutrition,
        memory: blueprint.memory,
        generator: blueprint.generator,
        starterBundle: blueprint.starterBundle,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  async function submit(answers) {
    if (!user || !db) return

    const blueprint = buildCloneBlueprintDoc(answers)
    await setDoc(
      doc(db, 'users', user.uid, 'intakes', 'main'),
      {
        surveyId: CLONE_SURVEY_ID,
        surveyVersion: CLONE_SURVEY_VERSION,
        status: 'submitted',
        answers: mergeCloneAnswers(answers),
        summary: blueprint.summary,
        cloneMeta: blueprint.cloneMeta,
        schemaVersion: blueprint.schemaVersion,
        template: blueprint.template,
        client: blueprint.client,
        brand: blueprint.brand,
        experience: blueprint.experience,
        navigation: blueprint.navigation,
        coach: blueprint.coach,
        tracking: blueprint.tracking,
        nutrition: blueprint.nutrition,
        memory: blueprint.memory,
        generator: blueprint.generator,
        starterBundle: blueprint.starterBundle,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  return {
    intake: user ? intake : null,
    loading,
    error: user && loadedUserId === user.uid ? error : null,
    actions: {
      saveDraft,
      submit,
    },
  }
}
