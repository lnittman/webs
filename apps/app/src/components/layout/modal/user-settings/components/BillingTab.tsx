import React from 'react';
import { Button } from '@repo/design/components/ui/button';
import { CreditCard, CheckCircle, Star, Rocket, Sparkle } from '@phosphor-icons/react';

export function BillingTab() {
  const currentPlan = 'free';
  
  const plans = [
    {
      id: 'free',
      name: 'free',
      description: 'basic access to core features',
      price: '$0',
      period: 'forever',
      features: [
        '250 messages per month',
        'standard response time',
        'basic chat features',
        'community support',
      ],
      icon: <Star className="h-5 w-5" weight="duotone" />,
      buttonText: 'current plan',
      buttonVariant: 'secondary',
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'pro',
      description: 'for power users who need more',
      price: '$10',
      period: 'per month',
      features: [
        'unlimited messages',
        'faster response time',
        'advanced features',
        'priority support',
        'export data in various formats',
        'early access to new features',
      ],
      icon: <Rocket className="h-5 w-5" weight="duotone" />,
      buttonText: 'upgrade to pro',
      buttonVariant: 'default',
      highlighted: true,
    },
    {
      id: 'team',
      name: 'team',
      description: 'collaboration for teams and organizations',
      price: '$25',
      period: 'per user / month',
      features: [
        'everything in pro',
        'team collaboration',
        'admin controls',
        'user management',
        'analytics and insights',
        'dedicated support',
      ],
      icon: <Sparkle className="h-5 w-5" weight="duotone" />,
      buttonText: 'contact sales',
      buttonVariant: 'outline',
      highlighted: false,
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-1">Billing</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and payment information
        </p>
      </div>

      <div className="flex flex-col gap-6 flex-1">
        {/* Current Plan */}
        <div className="bg-muted/20 rounded-md p-4 border border-border/40">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="h-5 w-5 text-primary" weight="duotone" />
            <h4 className="text-sm font-medium">Current Plan</h4>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                <span className="mr-2">{plans.find(p => p.id === currentPlan)?.name}</span>
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  Active
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Renews on never (free plan)
              </p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Manage
            </Button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-3 gap-4 flex-1">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`rounded-md border relative ${
                plan.highlighted 
                  ? 'border-primary shadow-sm' 
                  : 'border-border/40'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-2 left-0 right-0 flex justify-center">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-0.5 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="p-4 flex flex-col h-full">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {plan.icon}
                    <h4 className="font-medium">{plan.name}</h4>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{plan.price}</span>
                    <span className="text-xs text-muted-foreground">/{plan.period}</span>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" weight="fill" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  variant={plan.buttonVariant as any} 
                  className="w-full mt-auto"
                  disabled={currentPlan === plan.id}
                >
                  {plan.buttonText}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Message */}
        <div className="text-center bg-primary/5 rounded-md p-4 border border-primary/20 mt-auto">
          <p className="text-sm text-muted-foreground">
            Billing functionality is not yet implemented. This is a placeholder UI.
          </p>
        </div>
      </div>
    </div>
  );
} 