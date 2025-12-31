
import { EventNode, PolagramRoot } from '../../ast';

export class UnusedCleaner {
    public transform(root: PolagramRoot): PolagramRoot {
        const usedIds = this.collectUsedParticipants(root.events);
        
        // Filter participants
        const activeParticipants = root.participants.filter(p => usedIds.has(p.id));
        
        // Filter groups (remove if empty, clean up member lists)
        const activeGroups = root.groups.map(g => ({
            ...g,
            participantIds: g.participantIds.filter(pid => usedIds.has(pid))
        })).filter(g => g.participantIds.length > 0);

        return {
            ...root,
            participants: activeParticipants,
            groups: activeGroups
        };
    }

    private collectUsedParticipants(events: EventNode[]): Set<string> {
        const used = new Set<string>();
    
        function scan(nodes: EventNode[]) {
            for (const node of nodes) {
                switch (node.kind) {
                    case 'message':
                        if (node.from) used.add(node.from);
                        if (node.to) used.add(node.to);
                        break;
                    case 'fragment':
                        for (const branch of node.branches) {
                            scan(branch.events);
                        }
                        break;
                    case 'activation':
                        used.add(node.participantId);
                        break;
                    case 'note':
                        node.participantIds.forEach(id => used.add(id));
                        break;
                    case 'ref':
                        node.participantIds.forEach(id => used.add(id));
                        break;
                }
            }
        }
    
        scan(events);
        return used;
    }
}
