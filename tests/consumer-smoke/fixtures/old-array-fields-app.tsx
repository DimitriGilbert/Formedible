import { useFormedible } from '@/components/ui/formedible/hooks/use-formedible';
import { z } from 'zod';

export const arrayFieldsSchema = z.object({
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Valid email required'),
        role: z.enum(['developer', 'designer', 'manager', 'qa']),
        skills: z.array(z.string()),
        startDate: z.date(),
      }),
    )
    .min(1, 'At least one team member is required'),
  contactMethods: z.array(z.string().email('Must be valid email')).min(1, 'At least one contact method required'),
  emergencyContacts: z
    .array(
      z.object({
        name: z.string().min(1),
        relationship: z.string().min(1),
        phone: z.string().min(1),
        isPrimary: z.boolean(),
      }),
    )
    .max(3, 'Maximum 3 emergency contacts'),
});

type ArrayFieldsFormValues = z.infer<typeof arrayFieldsSchema>;

export default function App() {
  const arrayFieldsForm = useFormedible<ArrayFieldsFormValues>({
    schema: arrayFieldsSchema,
    fields: [
      {
        name: 'teamMembers',
        type: 'array',
        label: 'Team Members',
        section: {
          title: 'Team Composition',
          description: 'Add your team members',
        },
        arrayConfig: {
          itemType: 'object',
          itemLabel: 'Team Member',
          minItems: 1,
          maxItems: 10,
          sortable: true,
          addButtonLabel: 'Add Team Member',
          removeButtonLabel: 'Remove Member',
          defaultValue: {
            name: '',
            email: '',
            role: 'developer',
            skills: [],
            startDate: new Date(),
          },
          objectConfig: {
            fields: [
              {
                name: 'name',
                type: 'text',
                label: 'Name',
                placeholder: 'Enter name',
              },
              {
                name: 'email',
                type: 'text',
                label: 'Email',
                placeholder: 'Enter email',
              },
              {
                name: 'role',
                type: 'select',
                label: 'Role',
                options: [
                  { value: 'developer', label: 'Developer' },
                  { value: 'designer', label: 'Designer' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'qa', label: 'QA' },
                ],
              },
              {
                name: 'skills',
                type: 'text',
                label: 'Skills',
                placeholder: 'Enter skills (comma-separated)',
              },
              {
                name: 'startDate',
                type: 'text',
                label: 'Start Date',
                placeholder: 'YYYY-MM-DD',
              },
            ],
          },
        },
      },
      {
        name: 'contactMethods',
        type: 'array',
        label: 'Contact Email Addresses',
        section: {
          title: 'Contact Information',
          description: 'Primary and backup email addresses',
        },
        arrayConfig: {
          itemType: 'email',
          itemLabel: 'Email Address',
          itemPlaceholder: 'contact@company.com',
          minItems: 1,
          maxItems: 5,
          addButtonLabel: 'Add Email',
          removeButtonLabel: 'Remove',
          defaultValue: '',
        },
      },
      {
        name: 'emergencyContacts',
        type: 'array',
        label: 'Emergency Contacts',
        section: {
          title: 'Emergency Information',
          description: 'People to contact in case of emergency',
        },
        arrayConfig: {
          itemType: 'object',
          itemLabel: 'Emergency Contact',
          minItems: 0,
          maxItems: 3,
          addButtonLabel: 'Add Emergency Contact',
          removeButtonLabel: 'Remove Contact',
          defaultValue: {
            name: '',
            relationship: '',
            phone: '',
            isPrimary: false,
          },
          objectConfig: {
            fields: [
              {
                name: 'name',
                type: 'text',
                label: 'Name',
                placeholder: 'Enter name',
              },
              {
                name: 'relationship',
                type: 'text',
                label: 'Relationship',
                placeholder: 'e.g., Spouse, Parent',
              },
              {
                name: 'phone',
                type: 'text',
                label: 'Phone',
                placeholder: 'Enter phone number',
              },
              {
                name: 'isPrimary',
                type: 'text',
                label: 'Primary Contact',
                placeholder: 'true/false',
              },
            ],
          },
        },
      },
    ],
    formOptions: {
      defaultValues: {
        teamMembers: [
          {
            name: '',
            email: '',
            role: 'developer',
            skills: [],
            startDate: new Date(),
          },
        ],
        contactMethods: [''],
        emergencyContacts: [],
      },
      onSubmit: async ({ value }) => {
        console.info('Array fields form submitted:', value);
      },
    },
  });

  return <arrayFieldsForm.Form className="space-y-4" />;
}
