import * as admin from 'firebase-admin';

// Make sure you have initialized firebase-admin elsewhere in your app's entry point
// For example:
// import serviceAccount from './path/to/your/serviceAccountKey.json';
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });


/**
 * Sends a push notification to a specific list of device tokens via FCM.
 * Use this for sending to 'SelectedUsers'.
 *
 * @param tokens - An array of FCM registration tokens for the target devices.
 * @param title - The title of the notification.
 * @param body - The main content/body of the notification.
 * @param data - Optional data payload to send along with the notification.
 * @returns A promise that resolves with the FCM batch response.
 */
export const sendFcmNotification = async (
    tokens: string[],
    title: string,
    body: string,
    data?: { [key: string]: string }
): Promise<admin.messaging.BatchResponse> => {
    
    if (!tokens || tokens.length === 0) {
        console.log("No FCM tokens provided. Skipping notification send.");
        return {
            responses: [],
            successCount: 0,
            failureCount: 0,
        };
    }

    const message: admin.messaging.MulticastMessage = {
        notification: {
            title,
            body,
        },
        tokens,
        data: data || {}, // Ensure data is at least an empty object
        android: {
            notification: {
                sound: 'default'
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default'
                }
            }
        }
    };

    try {
        console.log(`Attempting to send notification to ${tokens.length} tokens.`);
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log('Successfully sent multicast message:', response);

        if (response.failureCount > 0) {
            const failedTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(tokens[idx]);
                    console.error(`Token failed: ${tokens[idx]}, Error: ${resp.error?.message}`);
                }
            });
            console.log('List of tokens that caused failures:', failedTokens);
            // TODO: Add logic here to remove these failed tokens from your database
        }

        return response;
    } catch (error) {
        console.error('Error sending FCM notification:', error);
        throw new Error('Failed to send FCM notification.');
    }
};

/**
 * Sends a push notification to a specific FCM topic.
 * Use this for sending to 'All' users or 'Segments'.
 *
 * @param topic - The name of the topic to send the notification to.
 * @param title - The title of the notification.
 * @param body - The main content/body of the notification.
 * @param data - Optional data payload to send along with the notification.
 * @returns A promise that resolves with the FCM message ID.
 */
export const sendFcmNotificationToTopic = async (
    topic: string,
    title: string,
    body: string,
    data?: { [key: string]: string }
): Promise<string> => {
    
    if (!topic) {
        throw new Error("FCM topic is required.");
    }

    const message: admin.messaging.Message = {
        notification: {
            title,
            body,
        },
        topic,
        data: data || {},
        android: {
            notification: {
                sound: 'default'
            }
        },
        apns: {
            payload: {
                aps: {
                    sound: 'default'
                }
            }
        }
    };

    try {
        console.log(`Attempting to send notification to topic: ${topic}`);
        const response = await admin.messaging().send(message);
        console.log('Successfully sent topic message:', response);
        return response;
    } catch (error) {
        console.error('Error sending FCM topic notification:', error);
        throw new Error('Failed to send FCM topic notification.');
    }
};


/**
 * Subscribes a list of device tokens to an FCM topic.
 * @param tokens - A single token or an array of tokens to subscribe.
 * @param topic - The topic to subscribe to.
 */
export const subscribeToTopic = async (tokens: string | string[], topic: string): Promise<admin.messaging.TopicManagementResponse> => {
    try {
        const response = await admin.messaging().subscribeToTopic(tokens, topic);
        console.log(`Successfully subscribed tokens to topic '${topic}'. Failures: ${response.failureCount}`);
        return response;
    } catch (error) {
        console.error(`Error subscribing to topic '${topic}':`, error);
        throw new Error('Failed to subscribe to FCM topic.');
    }
};

/**
 * Unsubscribes a list of device tokens from an FCM topic.
 * @param tokens - A single token or an array of tokens to unsubscribe.
 * @param topic - The topic to unsubscribe from.
 */
export const unsubscribeFromTopic = async (tokens: string | string[], topic: string): Promise<admin.messaging.TopicManagementResponse> => {
    try {
        const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
        console.log(`Successfully unsubscribed tokens from topic '${topic}'. Failures: ${response.failureCount}`);
        return response;
    } catch (error) {
        console.error(`Error unsubscribing from topic '${topic}':`, error);
        throw new Error('Failed to unsubscribe from FCM topic.');
    }
};
