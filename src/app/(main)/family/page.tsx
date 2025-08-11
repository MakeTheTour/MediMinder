import { Users2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const familyMembers = [
    { name: 'John Doe', relation: 'Father', avatar: '/avatars/01.png' },
    { name: 'Jane Smith', relation: 'Mother', avatar: '/avatars/02.png' }
]

export default function FamilyPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Circle</h1>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>My Family Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {familyMembers.map(member => (
              <div key={member.name} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                   <Avatar>
                    <AvatarImage data-ai-hint="person portrait" src={`https://placehold.co/40x40.png`} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.relation}</p>
                  </div>
                </div>
                 <Button variant="ghost" size="sm">Manage</Button>
              </div>
            ))}
             {familyMembers.length === 0 && (
                <div className="text-center py-10">
                    <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Your family circle is empty</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Add family members to share your progress.</p>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
