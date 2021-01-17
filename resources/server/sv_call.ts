import { ESX } from './server';
import events from '../utils/events';
import { getIdentifierByPhoneNumber, usePhoneNumber } from './functions';
import { XPlayer } from 'esx.js/@types/server';
/**
 * Returns the player phoneNumber for a passed identifier
 * @param identifier The players phone number
 */
async function getPlayerFromIdentifier(identifier: string): Promise<XPlayer> {
  return new Promise((res, rej) => {
    const xPlayers = ESX.GetPlayers();

    for (const player of xPlayers) {
      const xPlayer = ESX.GetPlayerFromId(player);
      if (
        xPlayer.getIdentifier() != null &&
        xPlayer.getIdentifier() == identifier
      ) {
        res(xPlayer);
      }
    }

    rej(new Error('Call Target Identifier was not found in xPlayers array'));
  });
}

onNet(events.PHONE_BEGIN_CALL, async (phoneNumber: string) => {
  try {
    const pSource = (global as any).source;
    const xPlayer = ESX.GetPlayerFromId(pSource);

    const _identifier = xPlayer.getIdentifier();
    const callerName = xPlayer.getName();
    const callerNumber = await usePhoneNumber(_identifier);
    const targetIdentifier = await getIdentifierByPhoneNumber(phoneNumber);

    const targetPlayer = await getPlayerFromIdentifier(targetIdentifier);
    console.log('got the targetPlayer');
    const targetName = targetPlayer.getName();
    console.log('got the target name: ', targetName);

    // target
    // Sends information to the client: sourec, playerName, number, isTransmitter
    emitNet(
      events.PHONE_START_CALL,
      targetPlayer.source,
      callerName,
      phoneNumber,
      false,
      pSource
    );

    // source
    // Sends information to the client: sourec, playerName, number, isTransmitter
    emitNet(
      events.PHONE_START_CALL,
      pSource,
      targetName,
      callerNumber,
      true,
      targetPlayer.source
    );
  } catch (e) {
    console.error(e);
    console.log('Failed to call monkaS');
    //emit(events.PHONE_CALL_ERROR, callSource);
  }
});

// phoneNumber is the number you're calling
onNet(events.PHONE_ACCEPT_CALL, async (phoneNumber: string) => {
  try {
    const pSource = (global as any).source;
    // target
    const targetIdentifier = await getIdentifierByPhoneNumber(phoneNumber);
    const targetPlayer = await getPlayerFromIdentifier(targetIdentifier);

    // client that is calling
    emitNet('phone:callAccepted', pSource, targetPlayer.source);

    // client that is being called
    emitNet('phone:callAccepted', targetPlayer.source, pSource);
  } catch (error) {}
});
